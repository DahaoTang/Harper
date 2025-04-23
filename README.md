# Harper

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

Harper is an AI-powered productivity assistant that bridges communication between team chat platforms and project management tools. Currently focused on Slack-to-Linear integration, Harper transforms natural language conversations into structured workflow actions, eliminating context switching between applications.
![example_1](https://github.com/user-attachments/assets/c48c78ee-d811-45ed-b236-aa094a61aee5)
![example_2](https://github.com/user-attachments/assets/0a076689-e167-4bc6-a80f-924abcb60220)


While today Harper excels at Linear issue tracking through Slack, its modular architecture is designed for expansion to GitHub, Jira, Notion, and other productivity platforms. The vision is to create a unified interface for managing all your development and project workflows through simple, natural language conversations.

## 🚀 Features

### Linear Integration

- **Create cards**: Create new Linear cards with details like title, description, status, assignee, and priority
- **Find cards**: Search for Linear cards by ID or content
- **Update cards**: Change status, assignee, priority, and other fields
- **Delete cards**: Remove Linear cards by ID

### Intelligent Natural Language Processing

- Uses OpenAI's GPT models to accurately parse user intent from natural language
- Adapts to various phrasings for the same request
- Matches user-provided values to available options in Linear (statuses, assignees, etc.)

### Simple Slack Interface

- Mention the bot in any Slack channel to manage Linear cards
- Get immediate responses with formatted card details
- Help commands to learn how to use the bot effectively

## 🛠️ Architecture

The project is built with:

- **Next.js**: For the API and web infrastructure
- **Adapters**: Modular interfaces for Linear, Slack, OpenAI, and (partial) GitHub
- **Intent System**: Classification and routing of incoming messages
- **Type Definitions**: Strongly typed interfaces for all external services

## 🔮 Future Development

### Enhanced Linear Support

- Support for sprints and cycles
- Team management features
- Advanced filtering and reporting

### GitHub Integration

- Issue creation and management
- Pull request tracking
- Repository actions

### Additional Integrations

- Jira support
- Notion integration
- Figma linking

### Advanced Features

- Conversation memory for multi-step workflows
- Dashboard for usage analytics
- Custom team-specific workflows

## 📋 Usage Examples

```
@harper create a linear card Fix login bug on mobile devices, assign to Sarah, high priority

@harper find linear card PRO-123

@harper update linear card PRO-123 status to In Progress

@harper find linear cards with authentication
```

## 🤝 Contributing

Contributions are welcome! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) License.  
You are free to use, modify, and share this code **non-commercially** with attribution.
