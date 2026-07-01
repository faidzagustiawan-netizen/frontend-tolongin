export interface QuestionComponent {
  type: string;
  question: string;
  description?: string;
  points: number;
  options?: any[];
  metadata?: any;
}

export interface BuilderProps {
  comp: QuestionComponent;
  onChange: (field: string, value: any) => void;
}

export interface SolverProps {
  comp: QuestionComponent;
  value: any;
  onChange: (value: any) => void;
}
