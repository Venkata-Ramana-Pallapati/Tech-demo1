export interface DataQualityMetrics {
  missing_values: Record<string, number>;
  duplicate_rows: number;
  null_values_percentage: Record<string, number>;
  duplicate_percentage: number;
  completeness_percentage: Record<string, number>;
  uniqueness_percentage: Record<string, number>;
}

export interface TableMetrics {
  [tableName: string]: DataQualityMetrics;
}

export interface User {
  email: string;
}


// types.ts
export interface CorrelationData {
  [column: string]: { [relatedColumn: string]: number };
}

export type ViewType = 'global' | 'custom';
// src/types/types.ts
/*export interface DataItem {
  name: string;
  value: number;
  yhat?: number; // Optional property to avoid further type errors

}*/
export interface DataItem {
  name:string;

  [key: string]: any;
  ds: string;
  value: number | string | undefined;
  yhat?: number | string;
  yhat_lower?: number | string;
  yhat_upper?: number | string;
  Category?: string;
  ProductName?: string;
  categoryData: DataItem[]; // Use imported DataItem

}
export type InsightCardProps = {
  key: string | number;
  category: string;
  growth: string;
  color: string;
  insight: string;
  direction: string;
  value: string;
  title: string; // Required property
  metric: string; // Required property
  categoryData: any[]; // Required property (adjust the type based on your data structure)
  colorMap: Record<string, string>; // Required property (for mapping categories to colors)
  description: string;
  children?: React.ReactNode; // This enables child components inside the card

  chartType?: string; // Add this optional prop
  fullMark: number; // Required property


};


export interface CategoryStatsProps {
  category: string;
  data: DataItem[];
  color: string;
  categoryData: DataItem[];
  colorMap: Record<string, string>;
  title: string;
  value: number;
}


