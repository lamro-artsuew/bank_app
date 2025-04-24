import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";

// Pie Chart
type PieChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
};

export function PieChartComponent({
  data,
  innerRadius = 60,
  outerRadius = 80,
  height = 300,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value}`, 'Value']} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Bar Chart
type BarChartProps = {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  keys: string[];
  colors: string[];
  height?: number;
  xAxisDataKey?: string;
};

export function BarChartComponent({
  data,
  keys,
  colors,
  height = 300,
  xAxisDataKey = "name",
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            name={key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// Line Chart
type LineChartProps = {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  keys: string[];
  colors: string[];
  height?: number;
  xAxisDataKey?: string;
};

export function LineChartComponent({
  data,
  keys,
  colors,
  height = 300,
  xAxisDataKey = "name",
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisDataKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        {keys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            name={key}
            activeDot={{ r: 8 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
