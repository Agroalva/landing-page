interface AttioPerson {
  id?: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: {
    [key: string]: any;
  };
}

interface AttioListEntry {
  id?: {
    workspace_id: string;
    object_id: string;
    list_id: string;
    entry_id: string;
  };
  parent_record_id: {
    workspace_id: string;
    object_id: string;
    record_id: string;
  };
  values: {
    [key: string]: any;
  };
}

interface AttioResponse<T> {
  data: T;
}

class AttioService {
  private apiKey: string;
  private baseUrl = 'https://api.attio.com/v2';
  private workspaceId: string;
  private personObjectId: string;
  private listId: string;

  constructor() {
    this.apiKey = process.env.ATTIO_API_KEY || '';
    this.workspaceId = process.env.ATTIO_WORKSPACE_ID || '';
    this.personObjectId = process.env.ATTIO_PERSON_OBJECT_ID || '';
    this.listId = process.env.ATTIO_LIST_ID || '';
    
    // Validate required environment variables
    if (!this.apiKey || !this.workspaceId || !this.listId) {
      console.warn('AttioService: Missing required environment variables. Some features may not work.');
    }
    // personObjectId is optional - we can use 'people' as the slug for standard people object
    if (!this.personObjectId) {
      console.info('AttioService: personObjectId not set, will use "people" slug for standard people object.');
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Attio API key is not configured');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let parsedError: any = null;
      let rawErrorText: string | undefined;
      try {
        parsedError = await response.json();
      } catch {
        try {
          rawErrorText = await response.text();
        } catch {
          // ignore
        }
      }
      let errorMessage = `Attio API error: ${response.status} - ${response.statusText}`;
      if (parsedError) {
        errorMessage = `Attio API error: ${response.status} - ${parsedError.message || parsedError.error || response.statusText}`;
        if (parsedError.details) {
          errorMessage += ` (${JSON.stringify(parsedError.details)})`;
        }
      } else if (rawErrorText) {
        errorMessage = `Attio API error: ${response.status} - ${response.statusText} - ${rawErrorText}`;
      }
      const safeOptions: Record<string, unknown> = { method: options.method || 'GET' };
      if (options.body) {
        try {
          safeOptions.body = JSON.parse(String(options.body));
        } catch {
          safeOptions.body = '<<non-JSON body>>';
        }
      }
      console.error('Attio API error response', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        errorJson: parsedError,
        errorText: rawErrorText,
        request: safeOptions,
      });
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async findPersonByEmail(email: string): Promise<AttioPerson | null> {
    try {
      // Use the query endpoint with filter in the body
      const queryData = {
        filter: {
          email_addresses: {
            email_address: {
              $eq: email,
            },
          },
        },
        limit: 1,
      };

      const response = await this.makeRequest<AttioResponse<AttioPerson[]>>(
        `/objects/people/records/query`,
        {
          method: 'POST',
          body: JSON.stringify(queryData),
        }
      );
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error finding person by email:', error);
      return null;
    }
  }

  /**
   * Assert (create or update) a person record by email.
   * Uses the Attio assert endpoint which will create if not exists, or update if exists.
   */
  async assertPerson(name: string, email: string): Promise<AttioPerson> {
    // Parse name into first and last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const fullName = name.trim();

    const personData = {
      data: {
        values: {
          email_addresses: [
            {
              email_address: email,
            }
          ],
          name: [
            {
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
            }
          ],
        }
      }
    };

    // Use assert endpoint with email_addresses as matching attribute
    const response = await this.makeRequest<AttioResponse<AttioPerson>>(
      `/objects/people/records?matching_attribute=email_addresses`,
      {
        method: 'PUT',
        body: JSON.stringify(personData),
      }
    );

    return response.data;
  }

  async findListEntry(recordId: string): Promise<AttioListEntry | null> {
    try {
      // Use the query endpoint with filter in the body
      const queryData = {
        filter: {
          parent_record: {
            target_record_id: {
              $eq: recordId,
            },
          },
        },
        limit: 1,
      };
      console.debug('Attio findListEntry query', {
        listId: this.listId,
        queryData,
      });

      const response = await this.makeRequest<AttioResponse<AttioListEntry[]>>(
        `/lists/${this.listId}/entries/query`,
        {
          method: 'POST',
          body: JSON.stringify(queryData),
        }
      );
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error finding list entry:', error);
      return null;
    }
  }

  async addToList(person: AttioPerson, additionalData?: Record<string, any>): Promise<AttioListEntry> {
    if (!person.id) {
      throw new Error('Person record is missing id information required to add to list.');
    }

    const { record_id } = person.id;
    const parentObject = 'people';
    const entryData = {
      data: {
        parent_record: {
          target_object: parentObject,
          target_record_id: record_id,
        },
        values: additionalData && Object.keys(additionalData).length > 0 ? additionalData : undefined,
      }
    };

    // Remove values if empty to avoid validation errors
    if (!entryData.data.values || Object.keys(entryData.data.values).length === 0) {
      delete entryData.data.values;
    }
    console.debug('Attio addToList payload', {
      listId: this.listId,
      parent_record: entryData.data.parent_record,
      hasValues: Boolean(entryData.data.values),
      values: entryData.data.values,
    });

    const response = await this.makeRequest<AttioResponse<AttioListEntry>>(
      `/lists/${this.listId}/entries`,
      {
        method: 'POST',
        body: JSON.stringify(entryData),
      }
    );

    return response.data;
  }

  async updateListEntry(entryId: string, additionalData?: Record<string, any>): Promise<AttioListEntry> {
    const entryData = {
      data: {
        values: additionalData && Object.keys(additionalData).length > 0 ? additionalData : undefined,
      }
    };

    if (!entryData.data.values || Object.keys(entryData.data.values).length === 0) {
      delete entryData.data.values;
    }

    const response = await this.makeRequest<AttioResponse<AttioListEntry>>(
      `/lists/${this.listId}/entries/${entryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(entryData),
      }
    );

    return response.data;
  }

  // Assert (create or update) a list entry for a person
  async assertListEntry(recordId: string, values?: Record<string, any>): Promise<AttioListEntry> {
    const payload = {
      data: {
        parent_object: 'people',
        parent_record_id: recordId,
        // Attio expects entry_values to exist; send empty object if none
        entry_values: values && Object.keys(values).length > 0 ? values : {},
      },
    };
    console.debug('Attio assertListEntry payload', {
      listId: this.listId,
      parent_object: payload.data.parent_object,
      parent_record_id: payload.data.parent_record_id,
      hasEntryValues: Boolean(payload.data.entry_values && Object.keys(payload.data.entry_values).length > 0),
      entry_values: payload.data.entry_values,
    });
    const response = await this.makeRequest<AttioResponse<AttioListEntry>>(
      `/lists/${this.listId}/entries`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
    return response.data;
  }

  async addOrUpdatePersonInList(name: string, email: string): Promise<{ success: boolean; message: string; isNewUser: boolean }> {
    try {
      // Check if person already exists to determine if it's a new user
      const existingPerson = await this.findPersonByEmail(email);
      const isNewUser = !existingPerson;

      // Use assert endpoint to create or update the person
      const person = await this.assertPerson(name, email);

      // Assert list entry via PUT (idempotent create/update)
      await this.assertListEntry(person.id!.record_id);
      
      return {
        success: true,
        message: isNewUser 
          ? '¡Gracias por unirte a la lista de espera!' 
          : '¡Gracias por actualizar tu información!',
        isNewUser,
      };
    } catch (error) {
      console.error('Error adding person to list:', error);
      return {
        success: false,
        message: 'Hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo.',
        isNewUser: false,
      };
    }
  }
}

export const attioService = new AttioService();
