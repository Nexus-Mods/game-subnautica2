export type IInstruction =
  | { type: 'copy'; source: string; destination: string }
  | { type: 'setmodtype'; value: string };

export interface ISupportedResult {
  supported: boolean;
  requiredFiles: string[];
}

export interface IInstallResult {
  instructions: IInstruction[];
}
