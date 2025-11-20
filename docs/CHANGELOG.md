# Changelog

All notable changes to SmartMoney will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation structure in `docs/` folder
- User guide with getting started and features overview
- Developer setup guide with detailed instructions
- Complete API reference documentation
- Architecture overview document
- Contributing guidelines
- Docker deployment guide

### Changed
- Reorganized documentation for better navigation
- Updated README.md with accurate feature list
- Moved outdated documentation to `archive/` folder
- Renamed "RECEIPT SCANNING.md" to fix filename issues
- Improved screenshot organization

### Documentation Refresh (November 2025)
- Created structured documentation hierarchy
- Separated user and developer documentation
- Added cross-references between documents
- Fixed inconsistencies between docs and code
- Updated screenshots and references

## [1.0.0] - 2025-11

### Added
- User authentication with two-layer password hashing (argon2id + SHA256)
- Transaction management (manual, OCR, voice input)
- Budget management with real-time tracking
- Saving goals with AI-generated plans
- AI integration with Naver Clova Studio HCX-007
- Receipt scanning with Naver Clova OCR
- Voice input with Naver Clova X STT
- Notification system (budget warnings, spending alerts)
- State management with automatic sync
- Docker deployment support
- MongoDB integration with Memory Server fallback

### Features
- **Authentication**: Secure login/signup with argon2id hashing
- **Transactions**: Add via manual entry, receipt scan, or voice
- **Budgets**: Set limits, track spending, get alerts
- **Goals**: Set targets, track progress, dedicate funds
- **AI Plans**: Personalized savings recommendations
- **Notifications**: Budget and spending alerts
- **Dashboard**: Visual overview of finances
- **Real-time Sync**: Auto-refresh every 5 seconds

### Technical
- React 18 + TypeScript frontend
- Ionic Framework 8 for mobile UI
- Express.js + MongoDB backend
- Naver Clova AI services integration
- Python sandbox with Firejail
- SSE streaming for AI generation
- Docker Compose deployment

### Security
- Two-layer password hashing
- Token-based authentication
- Site-specific salt
- Protected API endpoints
- Isolated AI sandbox
- No plaintext passwords

## [0.1.0] - Initial Development

### Added
- Basic project structure
- Frontend with React + Ionic
- Backend with Express + MongoDB
- Mock AI implementation
- Initial authentication
- Basic transaction tracking

---

## Legend

- `Added` - New features
- `Changed` - Changes to existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements

## Links

- [Repository](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers)
- [Documentation](docs/README.md)
- [Issues](https://github.com/huynhtrankhanh/naver-hackathon-vineyard-workers/issues)
