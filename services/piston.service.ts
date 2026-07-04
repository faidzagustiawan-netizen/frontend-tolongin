const JUDGE0_API_URL = 'https://ce.judge0.com/submissions?base64_encoded=false&wait=true';

// Mapping language strings to Judge0 Language IDs
export const LANGUAGE_VERSIONS: Record<string, number> = {
  javascript: 93, // Node.js 18.15.0
  typescript: 94, // TypeScript 5.0.3
  python: 92,     // Python 3.11.2
  go: 95,         // Go 1.18.5
  java: 91,       // Java (JDK 17.0.6)
  c: 103,         // C (GCC 14.1.0)
  cpp: 105,       // C++ (GCC 14.1.0)
  csharp: 51,     // C# (Mono 6.6.0.161)
  rust: 108,      // Rust 1.85.0
  php: 98,        // PHP 8.3.11
  ruby: 72,       // Ruby 2.7.0
  swift: 83,      // Swift 5.2.3
};

export interface Judge0Response {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
}

export const pistonService = {
  execute: async (language: string, code: string): Promise<string> => {
    try {
      const languageId = LANGUAGE_VERSIONS[language] || 93; // fallback to JS
      const response = await fetch(JUDGE0_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: code,
          language_id: languageId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const data: Judge0Response = await response.json();
      
      let output = '';
      if (data.compile_output) {
        output += `[Compile Error]\n${data.compile_output}\n`;
      }
      
      if (data.stderr) {
        output += `[Error]\n${data.stderr}\n`;
      }

      if (data.stdout) {
        output += data.stdout;
      }

      if (data.message) {
        output += `\n[Message]: ${data.message}`;
      }

      // If status is not Accepted (3), and we haven't printed stderr/compile error, print description
      if (data.status && data.status.id !== 3 && !data.compile_output && !data.stderr) {
        output += `\n[Status]: ${data.status.description}`;
      }
      
      return output.trim() || 'No output.';
    } catch (err: any) {
      return `[Error]\n${err.message || 'Unknown error occurred while executing code.'}`;
    }
  },
};
