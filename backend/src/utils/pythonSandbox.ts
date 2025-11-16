/**
 * Restricted Python interpreter using Firejail for AI tool execution
 * Enforces 6s wall clock time limit and 256MB RAM limit
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface PythonExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  timedOut?: boolean;
  memoryExceeded?: boolean;
}

/**
 * Execute Python code in a restricted sandbox using Firejail
 * @param code Python code to execute
 * @param timeout Timeout in milliseconds (default: 6000ms)
 * @param maxMemoryMB Maximum memory in MB (default: 256MB)
 * @returns Execution result
 */
export async function executePythonSandbox(
  code: string,
  timeout: number = 6000,
  maxMemoryMB: number = 256
): Promise<PythonExecutionResult> {
  // Create temporary directory for the script
  const tmpDir = mkdtempSync(join(tmpdir(), 'python-sandbox-'));
  const scriptPath = join(tmpDir, 'script.py');
  
  try {
    // Write Python code to temporary file
    writeFileSync(scriptPath, code, 'utf-8');
    
    // Firejail command with restrictions:
    // --noprofile: Don't use default profile
    // --net=none: Disable network access
    // --noroot: Don't allow root access
    // --caps.drop=all: Drop all capabilities
    // --seccomp: Enable seccomp filtering
    // --rlimit-as: Limit address space (memory)
    // --timeout: Wall clock timeout
    // --private-tmp: Use private /tmp
    // --private-dev: Use private /dev
    // --private: Make home directory private
    const firejailArgs = [
      '--noprofile',
      '--net=none',
      '--noroot',
      '--caps.drop=all',
      '--seccomp',
      `--rlimit-as=${maxMemoryMB * 1024 * 1024}`, // Convert MB to bytes
      '--private-tmp',
      '--private-dev',
      '--private',
      'python3',
      scriptPath
    ];
    
    return new Promise((resolve) => {
      const child = spawn('firejail', firejailArgs, {
        timeout,
        killSignal: 'SIGKILL'
      });
      
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let memoryExceeded = false;
      
      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        const errorStr = data.toString();
        stderr += errorStr;
        
        // Check for memory limit exceeded
        if (errorStr.includes('memory') || errorStr.includes('rlimit')) {
          memoryExceeded = true;
        }
      });
      
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeout);
      
      child.on('close', (code: number | null) => {
        clearTimeout(timeoutHandle);
        
        try {
          // Clean up temporary files
          unlinkSync(scriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        if (timedOut) {
          resolve({
            success: false,
            error: `Execution timed out after ${timeout}ms`,
            timedOut: true
          });
        } else if (memoryExceeded) {
          resolve({
            success: false,
            error: `Memory limit of ${maxMemoryMB}MB exceeded`,
            memoryExceeded: true
          });
        } else if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim()
          });
        } else {
          resolve({
            success: false,
            error: stderr.trim() || `Process exited with code ${code}`,
            output: stdout.trim()
          });
        }
      });
      
      child.on('error', (err: Error) => {
        clearTimeout(timeoutHandle);
        
        try {
          unlinkSync(scriptPath);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        resolve({
          success: false,
          error: `Failed to execute: ${err.message}`
        });
      });
    });
  } catch (error) {
    // Clean up on error
    try {
      unlinkSync(scriptPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    return {
      success: false,
      error: `Setup error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Check if Firejail is available on the system
 */
export async function isFirejailAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('which', ['firejail']);
    child.on('close', (code: number | null) => {
      resolve(code === 0);
    });
    child.on('error', () => {
      resolve(false);
    });
  });
}
