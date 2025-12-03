# ai-functions

Core AI primitives for building intelligent applications. This is the foundational package that all other primitives depend on.

## API

### AI Functions
- `AI()` - Core AI constructor
- `ai()` - Functional AI interface
- `ai.do()` - Execute AI actions
- `ai.is()` - AI-powered type checking/validation
- `ai[functionName]()` - Dynamic function invocation
- `ai.defineFunction()` - Define custom AI functions
- `ai.code()` - Generate code
- `ai.decide()` - AI-powered decision making
- `ai.diagram()` - Generate diagrams
- `ai.generate()` - General content generation
- `ai.image()` - Generate images
- `ai.video()` - Generate videos
- `ai.write()` - Generate text content

### RPC Primitives
- `rpc()` - Create RPC client interface
- `rpc.call()` - Make RPC calls
- `rpc.stream()` - Stream RPC responses
- `rpc.batch()` - Batch multiple RPC calls
- `createClient()` - Create typed RPC client (Cap'n Proto Web compatible)
- `createServer()` - Create typed RPC server
