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
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Attio API error: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async findPersonByEmail(email: string): Promise<AttioPerson | null> {
    try {
      const response = await this.makeRequest<AttioResponse<AttioPerson[]>>(
        `/objects/${this.personObjectId}/records?filter[equals][primary_email]=${encodeURIComponent(email)}`
      );
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error finding person by email:', error);
      return null;
    }
  }

  async createPerson(name: string, email: string): Promise<AttioPerson> {
    const personData = {
      values: {
        primary_email: email,
        name: name,
        // Add any other required fields for your Attio setup
      }
    };

    const response = await this.makeRequest<AttioResponse<AttioPerson>>(
      `/objects/${this.personObjectId}/records`,
      {
        method: 'POST',
        body: JSON.stringify(personData),
      }
    );

    return response.data;
  }

  async updatePerson(recordId: string, name: string, email: string): Promise<AttioPerson> {
    const personData = {
      values: {
        primary_email: email,
        name: name,
        // Add any other fields you want to update
      }
    };

    const response = await this.makeRequest<AttioResponse<AttioPerson>>(
      `/objects/${this.personObjectId}/records/${recordId}`,
      {
        method: 'PUT',
        body: JSON.stringify(personData),
      }
    );

    return response.data;
  }

  async findListEntry(recordId: string): Promise<AttioListEntry | null> {
    try {
      const response = await this.makeRequest<AttioResponse<AttioListEntry[]>>(
        `/lists/${this.listId}/entries?filter[equals][parent_record_id]=${recordId}`
      );
      
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error('Error finding list entry:', error);
      return null;
    }
  }

  async addToList(recordId: string, additionalData: Record<string, any> = {}): Promise<AttioListEntry> {
    const entryData = {
      parent_record_id: {
        workspace_id: this.workspaceId,
        object_id: this.personObjectId,
        record_id: recordId,
      },
      values: {
        // Add any list-specific fields here
        ...additionalData,
      }
    };

    const response = await this.makeRequest<AttioResponse<AttioListEntry>>(
      `/lists/${this.listId}/entries`,
      {
        method: 'POST',
        body: JSON.stringify(entryData),
      }
    );

    return response.data;
  }

  async updateListEntry(entryId: string, additionalData: Record<string, any> = {}): Promise<AttioListEntry> {
    const entryData = {
      values: {
        // Add any list-specific fields you want to update
        ...additionalData,
      }
    };

    const response = await this.makeRequest<AttioResponse<AttioListEntry>>(
      `/lists/${this.listId}/entries/${entryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(entryData),
      }
    );

    return response.data;
  }

  async addOrUpdatePersonInList(name: string, email: string): Promise<{ success: boolean; message: string; isNewUser: boolean }> {
    try {
      // Check if person already exists
      const existingPerson = await this.findPersonByEmail(email);
      let person: AttioPerson;
      let isNewUser = false;

      if (existingPerson) {
        // Update existing person
        person = await this.updatePerson(existingPerson.id!.record_id, name, email);
      } else {
        // Create new person
        person = await this.createPerson(name, email);
        isNewUser = true;
      }

      // Check if person is already in the list
      const existingEntry = await this.findListEntry(person.id!.record_id);
      
      if (existingEntry) {
        // Update existing list entry
        await this.updateListEntry(existingEntry.id!.entry_id, {
          // Add any fields you want to update when they resubscribe
          last_updated: new Date().toISOString(),
        });
        
        return {
          success: true,
          message: '¡Gracias por actualizar tu información!',
          isNewUser: false,
        };
      } else {
        // Add to list
        await this.addToList(person.id!.record_id, {
          // Add any initial list-specific data
          added_at: new Date().toISOString(),
        });
        
        return {
          success: true,
          message: isNewUser 
            ? '¡Gracias por unirte a la lista de espera!' 
            : '¡Gracias por unirte a la lista de espera!',
          isNewUser,
        };
      }
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
