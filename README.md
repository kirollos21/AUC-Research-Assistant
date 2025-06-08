# AUC Research Assistant

An AI-powered research assistant platform that helps researchers discover, analyze, and synthesize academic papers and research materials.

## Project Structure

```
/
├── backend/                 # Backend API (Python/FastAPI)
├── frontend/               # Next.js frontend application
├── docs/                   # Project documentation
├── tests/                  # Test suites
├── .github/                # GitHub workflows and templates
├── docker/                 # Docker configurations
├── scripts/                # Development and deployment scripts
└── README.md              # This file
```

## Technology Stack

### Backend
- **Python 3.11+** with FastAPI framework
- **Reasoning**: Python excels in AI/ML workloads, has mature LLM libraries, and offers excellent data processing capabilities
- Database: PostgreSQL with vector extensions for embeddings
- Authentication: JWT-based authentication
- API Documentation: Automatic OpenAPI/Swagger generation via FastAPI

### Frontend
- **Next.js 14** with TypeScript
- **Styling**: Tailwind CSS for modern, responsive UI
- **State Management**: React Query for server state, Zustand for client state
- **Authentication**: NextAuth.js integration

### AI/ML Components
- **LLM Integration**: OpenAI API, with support for local models
- **Vector Database**: Pinecone or local vector storage
- **Document Processing**: PyPDF2, spaCy for text processing

## Development Environment Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- Docker (optional, for containerized development)

### Backend Setup (Python)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the development server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup (Next.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## Development Guidelines

### Coding Conventions
- **Python**: Follow PEP 8 style guide, use Black for formatting
- **TypeScript/React**: Follow Airbnb style guide, use Prettier for formatting
- **Commits**: Use conventional commit format (feat, fix, docs, etc.)

### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Examples:
- `feat(api): add document upload endpoint`
- `fix(frontend): resolve authentication redirect issue`
- `docs(readme): update setup instructions`

### Branch Naming Convention
- `feature/description` - for new features
- `bugfix/description` - for bug fixes
- `hotfix/description` - for urgent fixes
- `docs/description` - for documentation updates

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
# or
yarn test
```

## Deployment

[Deployment instructions will be added as the project develops]

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

- Kirollos Zikry
- Alyaman Massarani
- Adham Ali
- Eslam Mohamed Tawfik

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.
