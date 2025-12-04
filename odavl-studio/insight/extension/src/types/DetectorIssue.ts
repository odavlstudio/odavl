/**
 * Issue detected by a language-specific detector
 */
import { ProgrammingLanguage } from '../language-detector';

export interface DetectorIssue {
  file: string;
  line: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
  length?: number;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint' | 'critical' | 'low';
  code?: string;
  detector: string;
  language: ProgrammingLanguage;
  autoFixable?: boolean;
}
