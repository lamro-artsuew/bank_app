import { PieChartComponent } from "@/components/ui/chart";

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
}

interface ExpenseChartProps {
  categories: CategoryData[];
}

export default function ExpenseChart({ categories }: ExpenseChartProps) {
  // Define category colors
  const getCategoryColor = (name: string) => {
    const colorMap: Record<string, string> = {
      "Housing": "#3A36DB",
      "Food & Dining": "#00BFA5",
      "Transportation": "#FFB300",
      "Entertainment": "#FF5252",
      "Utilities": "#2196F3",
      "Shopping": "#9C27B0",
      "Healthcare": "#4CAF50",
      "Education": "#795548",
      "Other": "#607D8B",
    };
    
    return colorMap[name] || "#607D8B"; // Default to "Other" color
  };

  // Map categories to the format needed by the pie chart
  const chartData = categories.map(category => ({
    name: category.name,
    value: category.value,
    color: getCategoryColor(category.name)
  }));

  return (
    <div>
      {/* Chart Placeholder */}
      <div className="h-52 mb-5">
        {categories.length > 0 ? (
          <PieChartComponent data={chartData} innerRadius={50} outerRadius={70} />
        ) : (
          <div className="h-full bg-neutral-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto mb-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>No expense data available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Expense Categories */}
      <div className="space-y-4">
        {categories.length > 0 ? (
          categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <div 
                  className="h-3 w-3 rounded-full mr-2" 
                  style={{ backgroundColor: getCategoryColor(category.name) }}
                />
                <p className="text-sm text-neutral-700">{category.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{category.percentage}%</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-neutral-500 py-2 text-sm">
            Make some transactions to see your expense breakdown
          </div>
        )}
      </div>
    </div>
  );
}
