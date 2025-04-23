# Harper

Harper is an AI-powered productivity assistant that bridges communication between team chat platforms and project management tools. Currently focused on Slack-to-Linear integration, Harper transforms natural language conversations into structured workflow actions, eliminating context switching between applications.

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

This project is licensed under the MIT License.
