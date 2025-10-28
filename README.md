# landing-page

## Attio Integration Setup

This project integrates with [Attio API](https://api.attio.com/openapi/api) to manage newsletter signups and user data.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
ATTIO_API_KEY=your_attio_api_key_here
ATTIO_WORKSPACE_ID=your_workspace_id_here
ATTIO_PERSON_OBJECT_ID=your_person_object_id_here
ATTIO_LIST_ID=your_list_id_here
```

### How to get Attio credentials:

1. **API Key**: Go to your Attio workspace settings and create a new API key
2. **Workspace ID**: Found in your Attio workspace URL or API responses
3. **Person Object ID**: The UUID of the "People" object in your workspace
4. **List ID**: The UUID of the specific list you want to add users to

### Features

- **Duplicate Prevention**: Checks if a user already exists by email
- **Update Existing Users**: Updates existing user information if they resubscribe
- **List Management**: Adds users to a specific Attio list
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Shows loading indicators during API calls

### API Endpoints

- `POST /api/newsletter` - Handles newsletter signup and Attio integration