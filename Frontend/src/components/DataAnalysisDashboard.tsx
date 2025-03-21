import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, RadialBarChart, RadialBar, BarChart, Bar, ScatterChart, Scatter, ZAxis } from "recharts";
import FileUploadSection from "./FileUploadSection";
import DateRangeSection from "./DateRangeSection";
import ModelSelector from "./ModelSelector";
import GroupSelector from "./GroupSelector";
import FetchButton from "./FetchButton";
import CategoryStats from "./CategoryStats";
import InsightCard from "./InsightCard";
import CustomTooltip from "./CustomTooltip";
import { DataItem } from "/home/sigmoid/Pictures/project/src/types"; // Adjust the path based on your folder structure
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';


interface GroupSelections {
  [key: string]: string[];
}
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}


const TimeseriesPredictionChart: React.FC = () => {
  const [data, setData] = useState<DataItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupingColumns, setGroupingColumns] = useState<string[]>([]);
  const [metricColumns, setMetricColumns] = useState<string[]>([]);
  const [selectedMetric, setSelectedMetric] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("Prophet");
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [groupSelections, setGroupSelections] = useState<GroupSelections>({});
  const [uniqueGroupValues, setUniqueGroupValues] = useState<{[key: string]: string[]}>({});
  const [viewMode, setViewMode] = useState<string>("line");
  const [downloadFormat, setDownloadFormat] = useState<string>("csv");
  
  const modelOptions = [
    { value: "Prophet", label: "Prophet", description: "Facebook's time series forecasting model" },
    { value: "ETS", label: "ETS", description: "Predicts future values by learning trends, seasonality, and noise." },
    { value: "ARIMA", label: "ARIMA", description: "Statistical method for time series forecasting" },
    { value: "SARIMA", label: "SARIMA", description: "Statistical method for time series forecasting" }
  ];

  useEffect(() => {
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + 30);
    setStartDate(currentDate.toISOString().split('T')[0]);
    setEndDate(futureDate.toISOString().split('T')[0]);
  }, []);

  const generateColorMap = (categories: string[]) => {
    const predefinedColors = [
      "#1E88E5", "#D81B60", "#8E24AA", "#43A047", 
      "#FB8C00", "#E53935", "#5E35B1", "#3949AB",
      "#039BE5", "#00ACC1", "#00897B", "#7CB342",
      "#FFD600", "#6D4C41", "#546E7A", "#F06292"
    ];
    
    const colorMap: { [key: string]: string } = {};
    categories.forEach((category, index) => {
      colorMap[category] = predefinedColors[index % predefinedColors.length];
    });
    
    return colorMap;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleStartDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(event.target.value);
  };

  const handleEndDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(event.target.value);
  };

  const handleMetricChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMetric(event.target.value);
  };
  
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(event.target.value);
  };

  const handleGroupSelectionChange = (groupColumn: string, values: string[]) => {
    setGroupSelections(prev => ({
      ...prev,
      [groupColumn]: values
    }));
  };

  const fetchPredictions = async () => {
    if (!file || !startDate || !endDate) return;
  
    setLoading(true);
    setLastFetch(new Date());
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("start_date", startDate);
    formData.append("end_date", endDate);
    formData.append("model_name", selectedModel);
  
    try {
     
     

      const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
      console.log("API Base URL:", API_BASE_URL);    
      console.log("hello",API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/predict/`, { 

      
    

        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!result.error) {
        analyzeDataStructure(result.predictions);
        const processedData = preprocessData(result.predictions);
        setData(processedData);
        
        const metrics = getUniqueMetrics(processedData);
        if (metrics.length > 0 && typeof metrics[0] === 'string') {
          setSelectedMetric(metrics[0]);
        }
        
        extractUniqueGroupValues(processedData);
      } else {
        console.error("Error:", result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to fetch predictions:", error);
      alert("Failed to fetch predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractUniqueGroupValues = (processedData: DataItem[]) => {
    const groupValues: {[key: string]: Set<string>} = {};
    const initialSelections: GroupSelections = {};
    
    groupingColumns.forEach(col => {
      groupValues[col] = new Set<string>();
      initialSelections[col] = [];
    });
    
    if (processedData.length > 0 && processedData[0].Group && typeof processedData[0].Group === 'object') {
      processedData.forEach(item => {
        if (item.Group) {
          groupingColumns.forEach(col => {
            if (item.Group[col] && typeof item.Group[col] === 'string') {
              groupValues[col].add(item.Group[col]);
            }
          });
        }
      });
    } else {
      processedData.forEach(item => {
        groupingColumns.forEach(col => {
          if (item[col] && typeof item[col] === 'string') {
            groupValues[col].add(item[col]);
          } else if (Array.isArray(item[col])) {
            item[col].forEach((value: string) => {
              if (value) groupValues[col].add(value);
            });
          }
        });
      });
    }
    
    const uniqueValues: {[key: string]: string[]} = {};
    Object.keys(groupValues).forEach(col => {
      uniqueValues[col] = Array.from(groupValues[col]).sort();
    });
    
    setUniqueGroupValues(uniqueValues);
    setGroupSelections(initialSelections);
  };

  const preprocessData = (rawData: any) => {
    if (!rawData || rawData.length === 0) return [];
    
    return rawData.map((item: any) => {
      const dateObj = new Date(item.ds);
      const formattedDate = dateObj.toISOString().split('T')[0];
      const processedItem = { ...item, ds: formattedDate };
      
      if (typeof item.yhat === 'string') {
        processedItem.yhat = parseFloat(item.yhat);
      }
      
      if (item.yhat_lower) {
        processedItem.yhat_lower = typeof item.yhat_lower === 'string' 
          ? parseFloat(item.yhat_lower) 
          : item.yhat_lower;
      }
      
      if (item.yhat_upper) {
        processedItem.yhat_upper = typeof item.yhat_upper === 'string' 
          ? parseFloat(item.yhat_upper) 
          : item.yhat_upper;
      }
      
      return processedItem;
    });
  };
  
  const analyzeDataStructure = (data: any) => {
    if (!data || data.length === 0) return;
    
    const firstItem = data[0];
    const columns = Object.keys(firstItem);
    let potentialGroupingColumns = [];
    
    if (firstItem.Group && typeof firstItem.Group === 'object') {
      potentialGroupingColumns = Object.keys(firstItem.Group);
    } else {
      potentialGroupingColumns = columns.filter(col => {
        const sample = firstItem[col];
        
        if (typeof sample === 'string') {
          const isNotNumeric = !/^\d+(\.\d+)?$/.test(sample);
          const isNotDate = !/^\d{4}-\d{2}-\d{2}/.test(sample) && col !== 'ds';
          const isExplicitGroup = /^(group|category|segment|product|line|division)/i.test(col);
          
          return (Array.isArray(sample) || (isNotNumeric && isNotDate) || isExplicitGroup);
        }
        
        return false;
      });
    }
    
    const potentialMetricColumns = columns.includes('Metric') ? ['Metric'] : 
      columns.filter(col => {
        return /^(metric|measure|indicator|type|kpi)/i.test(col);
      });

    setGroupingColumns(potentialGroupingColumns);
    setMetricColumns(potentialMetricColumns.length > 0 ? potentialMetricColumns : ['default']);
  };

  const getUniqueMetrics = (dataSet = data) => {
    if (dataSet.length === 0) return [];
    
    if (dataSet[0].hasOwnProperty('Metric')) {
      return Array.from(new Set(dataSet.map(item => item.Metric)));
    }
    
    if (metricColumns.length > 0 && metricColumns[0] !== 'default') {
      const metricCol = metricColumns[0];
      return Array.from(new Set(dataSet.map(item => item[metricCol])));
    }
    
    return ['Product Growth Forecast'];
  };

  const getCategories = (metricName: any, dataSet = data) => {
    if (dataSet.length === 0) return [];
    
    const filteredData = metricColumns[0] !== 'default' && metricColumns[0] === 'Metric'
      ? dataSet.filter(item => item.Metric === metricName)
      : dataSet;

    const dataAfterGroupFilters = applyGroupFilters(filteredData);
    
    if (dataAfterGroupFilters.length > 0 && dataAfterGroupFilters[0].Group && typeof dataAfterGroupFilters[0].Group === 'object') {
      const unselectedGroups = groupingColumns.filter(col => !groupSelections[col] || groupSelections[col].length === 0);
      const categoryCol = unselectedGroups.length > 0 ? unselectedGroups[0] : groupingColumns[0];
      
      if (!categoryCol) return ['Overall'];
      
      const uniqueCategories = new Set<string>();
      
      dataAfterGroupFilters.forEach(item => {
        if (item.Group && item.Group[categoryCol]) {
          uniqueCategories.add(item.Group[categoryCol]);
        }
      });
      
      return Array.from(uniqueCategories).sort();
    } else if (groupingColumns.length > 0) {
      const unselectedGroups = groupingColumns.filter(col => !groupSelections[col] || groupSelections[col].length === 0);
      const groupCol = unselectedGroups.length > 0 ? unselectedGroups[0] : groupingColumns[0];
      
      if (!groupCol) return ['Overall'];
      
      if (dataAfterGroupFilters.length > 0 && Array.isArray(dataAfterGroupFilters[0][groupCol])) {
        const uniqueCategories = new Set<string>();
        
        dataAfterGroupFilters.forEach(item => {
          const groupArray = item[groupCol];
          if (Array.isArray(groupArray)) {
            groupArray.forEach(value => {
              if (value) uniqueCategories.add(value.toString());
            });
          }
        });
        
        return Array.from(uniqueCategories);
      } else {
        const categories = Array.from(
          new Set(
            dataAfterGroupFilters.map(item => item[groupCol])
          )
        );
        return categories.filter(c => c).sort();
      }
    }
    
    return ['Product Trend'];
  };

  const applyGroupFilters = (dataToFilter: DataItem[]) => {
    if (Object.keys(groupSelections).length === 0) return dataToFilter;
    
    return dataToFilter.filter(item => {
      return Object.entries(groupSelections).every(([column, selectedValues]) => {
        if (selectedValues.length === 0) return true;
        
        if (item.Group && typeof item.Group === 'object') {
          return selectedValues.includes(item.Group[column]);
        }
        
        if (Array.isArray(item[column])) {
          return item[column].some(value => selectedValues.includes(value));
        }
        
        return selectedValues.includes(item[column]);
      });
    });
  };

  const getFilteredData = (metricName: string) => {
    if (data.length === 0) return [];
  
    let filtered = metricColumns[0] !== 'default'
      ? data.filter(item => item.Metric === metricName)
      : data;
  
    filtered = applyGroupFilters(filtered);
  
    const selectedGroupColumns = Object.keys(groupSelections).filter(
      col => groupSelections[col] && groupSelections[col].length > 0
    );
  
    if (selectedGroupColumns.length > 1) {
      const aggregatedData: { [key: string]: DataItem } = {};
  
      filtered.forEach(item => {
        const date = item.ds;

        if (!aggregatedData[date]) {
          aggregatedData[date] = { ...item, yhat: 0 };
        }

        aggregatedData[date].yhat = Number(aggregatedData[date].yhat) + (typeof item.yhat === 'number' ? item.yhat : 0);
      });

      return Object.values(aggregatedData).sort((a, b) =>
        new Date(a.ds).getTime() - new Date(b.ds).getTime()
      );
    }
  
    return filtered;
  };

  const getCategoryData = (category: string, metricName: string) => {
    const filtered = getFilteredData(metricName);
    if (filtered.length === 0) return [];
  
    if (filtered[0].Group && typeof filtered[0].Group === 'object') {
      const unselectedGroups = groupingColumns.filter(col =>
        !groupSelections[col] || groupSelections[col].length === 0
      );
      const categoryCol = unselectedGroups.length > 0 ? unselectedGroups[0] : groupingColumns[0];
  
      return filtered.filter(item => item.Group[categoryCol] === category);
    }
  
    for (const col of groupingColumns) {
      const hasCategory = filtered.some(item => {
        if (Array.isArray(item[col])) {
          return item[col].includes(category);
        }
        return item[col] === category;
      });
  
      if (hasCategory) {
        return filtered.filter(item => {
          if (Array.isArray(item[col])) {
            return item[col].includes(category);
          }
          return item[col] === category;
        });
      }
    }
  
    return filtered;
  };

  const getTableData = (metricName: string) => {
    const filtered = getFilteredData(metricName);
    if (filtered.length === 0) return [];
    
    const groupedByDate: {[key: string]: any} = {};
    
    filtered.forEach(item => {
      const date = item.ds;
      if (!groupedByDate[date]) {
        groupedByDate[date] = { date };
      }
      
      let category = 'Unknown';
      
      if (item.Group && typeof item.Group === 'object') {
        const unselectedGroups = groupingColumns.filter(col => 
          !groupSelections[col] || groupSelections[col].length === 0
        );
        const categoryCol = unselectedGroups.length > 0 ? unselectedGroups[0] : groupingColumns[0];
        category = item.Group[categoryCol];
      } else {
        for (const col of groupingColumns) {
          if (item[col]) {
            category = Array.isArray(item[col]) ? item[col][0] : item[col];
            break;
          }
        }
      }
      
      groupedByDate[date][category] = item.yhat;
    });
    
    return Object.values(groupedByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Get pie chart data by summing values by category
  const getPieChartData = (metricName: string) => {
    const categories = getCategories(metricName);
    if (categories.length === 0) return [];
    
    return categories.map(category => {
      const categoryData = getCategoryData(category, metricName);
      const sum = categoryData.reduce((acc, item) => acc + (Number(item.yhat) || 0), 0);
      return {
        name: category,
        value: parseFloat(sum.toFixed(2))
      };
    });
  };

  // Get aggregate stats for meter charts
  const getAggregateStats = (metricName: string) => {
    const categories = getCategories(metricName);
    
    return categories.map(category => {
      const categoryData = getCategoryData(category, metricName);
      if (categoryData.length === 0) return { name: category, value: 0, fullMark: 100 };
      
      const values = categoryData.map(item => item.yhat || 0);
      const avg = values.reduce((acc: number, val: number | string) => acc + Number(val), 0) / values.length;
      
      // Calculate growth rate
      const firstValue = values[0] || 0;
      const lastValue = values[values.length - 1] || 0;
      const growthPercent = Number(firstValue) === 0 ? 0 : ((Number(lastValue) - Number(firstValue)) / Number(firstValue)) * 100;
      
      return {
        name: category,
        value: Math.min(Math.abs(growthPercent), 100), // Cap at 100 for visualization
        fullMark: 100,
        actualValue: growthPercent.toFixed(2) + '%',
        average: avg.toFixed(2)
      };
    });
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    
    const tableData = getTableData(selectedMetric);
    if (tableData.length === 0) return;
    
    const columns = Object.keys(tableData[0]);
    let csvContent = columns.join(',') + '\n';
    
    tableData.forEach(row => {
      const rowData = columns.map(col => {
        const value = row[col];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',');
      csvContent += rowData + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    if (data.length === 0) return;
    
    const tableData = getTableData(selectedMetric);
    if (tableData.length === 0) return;
    
    // Create CSV content (Excel can open CSV files)
    const columns = Object.keys(tableData[0]);
    let csvContent = columns.join(',') + '\n';
    
    tableData.forEach(row => {
      const rowData = columns.map(col => {
        const value = row[col];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',');
      csvContent += rowData + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const downloadPDF = () => {
    if (data.length === 0) return;
        
    const tableData = getTableData(selectedMetric);
    if (tableData.length === 0) return;
        
    // Create new jsPDF instance
    const pdf = new jsPDF();
    const columns = Object.keys(tableData[0]);
        
    // Add title
    pdf.text(`Forecast Report - ${new Date().toLocaleDateString()}`, 14, 15);
        
    // Set up table data
    const rows = tableData.map(row => columns.map(col => row[col]));
    
    // Use the imported autoTable function
    autoTable(pdf, {
      head: [columns],
      body: rows,
      startY: 25
    });
        
    // Save PDF
    pdf.save(`forecast_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  const downloadHTML = () => {
    const dashboardHtml = document.documentElement.outerHTML;
    const blob = new Blob([dashboardHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `forecast_dashboard_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownload = () => {
    switch(downloadFormat) {
      case 'csv':
        downloadCSV();
        break;
      case 'excel':
        downloadExcel();
        break;
      case 'pdf':
        downloadPDF();
        break;
      default:
        downloadCSV();
    }
  };

  const toggleView = (viewType: string) => {
    setViewMode(viewType);
  };

  const hasData = data.length > 0;
  const categories = hasData ? getCategories(selectedMetric) : [];
  const colorMap = generateColorMap(categories);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-600 mb-2 transition-all duration-300 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700">
          Data analysis and prediction Application
          </h1>
          <p className="text-sm text-indigo-600 max-w-2xl mx-auto">
            Upload your product data, select parameters, and generate AI-powered forecasts with comprehensive visualizations
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-8 transition-all duration-300 hover:shadow-2xl border border-indigo-100 transform hover:-translate-y-1">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <FileUploadSection file={file} handleFileChange={handleFileChange} />
            <DateRangeSection
                startDate={startDate}
                endDate={endDate}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
              />
              <ModelSelector
                selectedModel={selectedModel}
                handleModelChange={handleModelChange}
                modelOptions={modelOptions}
              />
              <div className="col-span-1 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select
                  className="w-full p-2 border border-indigo-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-400"
                  value={selectedMetric}
                  onChange={handleMetricChange}
                >
                  {getUniqueMetrics().map((metric) => (
                    <option key={metric} value={metric}>
                      {metric}
                    </option>
                  ))}
                </select>
              </div>
              <FetchButton
                fetchPredictions={fetchPredictions}
                loading={loading}
                disabled={!file || !startDate || !endDate}
                file={file}
              />
            </div>

            {groupingColumns.length > 0 && hasData && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border border-indigo-100 transition-all duration-300 hover:from-indigo-50 hover:to-purple-50">
                <h3 className="text-lg font-medium text-indigo-800 mb-3">Filter By Groups</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupingColumns.map((column) => (
                      <GroupSelector
                      key={column}
                      groupName={column}
                      options={uniqueGroupValues[column] || []}
                      selectedValues={groupSelections[column] || []}
                      onChange={(values) => handleGroupSelectionChange(column, values)}
                      groupColumn={column}
                      groupValues={uniqueGroupValues[column] || []}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasData && (
            <div className="mt-8 animate-fade-in">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  {selectedMetric} Forecast
                </h2>
                <div className="flex flex-wrap space-x-2 mt-2 sm:mt-0">
                  <div className="flex space-x-1 mr-4">
                    <button
                      onClick={() => toggleView('line')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'line' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      Line
                    </button>
                    <button
                      onClick={() => toggleView('table')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'table' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      Table
                    </button>
                    <button
                      onClick={() => toggleView('pie')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'pie' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      Pie
                    </button>
                    <button
                      onClick={() => toggleView('bar')}
                      className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${viewMode === 'bar' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      Bar
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      className="text-sm border border-indigo-200 rounded-md p-1 focus:ring-indigo-500 focus:border-indigo-500"
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value)}
                    >
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                    </select>
                    <button
                      onClick={handleDownload}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 transform hover:scale-105"
                      disabled={!hasData}
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>

              {lastFetch && (
                <p className="text-xs text-indigo-500 mb-4">
                  Last updated: {lastFetch.toLocaleString()}
                </p>
              )}

              <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 transition-all duration-500 hover:shadow-lg mb-8">
                {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gradient-to-r from-indigo-50 to-blue-50">
                      <tr>
                        <th className="py-3 px-4 border-b border-indigo-200 text-indigo-800">Date</th>
                        {categories.map((category) => (
  <th
    key={category}
    className="py-3 px-4 border-b border-indigo-200 font-medium"
    style={{ color: colorMap[category] }}
  >
    {category}
  </th>
))}
                      </tr>
                    </thead>
                    <tbody>
                      {getTableData(selectedMetric).map((row, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                          <td className="py-2 px-4 border-b border-indigo-100 font-semibold">{row.date}</td>
                          {categories.map((category) => (
                            <td 
                              key={category} 
                              className="py-2 px-4 border-b border-indigo-100 text-right"
                            >
                              {row[category] ? row[category].toFixed(2) : "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                ) : viewMode === 'pie' ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getPieChartData(selectedMetric)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPieChartData(selectedMetric).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colorMap[entry.name]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : viewMode === 'bar' ? (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getTableData(selectedMetric)}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 70,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          interval={0}
                        />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ bottom: 0, left: 0 }} />
                        {categories.map((category) => (
                          <Bar 
                            key={category} 
                            dataKey={category} 
                            fill={colorMap[category]} 
                            stackId="a"
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="ds" 
                          type="category" 
                          allowDuplicatedCategory={false} 
                          angle={-45}
                          textAnchor="end"
                          height={70}
                          interval={0}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          label={{ value: selectedMetric, angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ bottom: 0, left: 20 }} />
                        {categories.map((category) => {
                          const categoryData = getCategoryData(category, selectedMetric);
                          return (
                            <Line
                              key={category}
                              data={categoryData}
                              name={category}
                              type="monotone"
                              dataKey="yhat"
                              stroke={colorMap[category]}
                              activeDot={{ r: 8 }}
                              dot={{ r: 4 }}
                              isAnimationActive={true}
                              animationDuration={1000}
                            />
                          );
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <CategoryStats 
                    title="Total Categories"
                    value={categories.length}
                    icon="CubeIcon"
                    trend={{ value: "+12%", direction: "up" }}
                    category="Categories"
                    categoryData={[]}
                    data={[]}
                    colorMap={{}}
                  />

              <CategoryStats 
                title="Forecast Horizon" 
                value={`${Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days`} 
                icon="CalendarIcon" 
                trend={{ value: "", direction: "neutral" }}
                category=""
                categoryData={[]} 
                data={[]} 
                colorMap={{}} 
              />

              <CategoryStats 
                title="Model Used" 
                value={selectedModel} 
                icon="ChartBarIcon" 
                trend={{ value: "AI-powered", direction: "up" }}
                category=""
                categoryData={[]} 
                data={[]} 
                colorMap={{}} 
              />

          <CategoryStats 
            title="Last Updated" 
            value={lastFetch ? lastFetch.toLocaleDateString() : "Never"} 
            icon="RefreshIcon" 
            trend={{ value: lastFetch ? lastFetch.toLocaleTimeString() : "", direction: "neutral" }}
            category="" 
            categoryData={[]} 
            data={[]} 
            colorMap={{}} 
          />

                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 col-span-1">
                  <h3 className="text-lg font-medium text-indigo-700 mb-4">Growth Metrics by Category</h3>
                  <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="130%"
          data={getAggregateStats(selectedMetric)}
          startAngle={180}
          endAngle={0}
        >
          <RadialBar
            startAngle={90}
            endAngle={-270}
            background={{ fill: '#f3f3f3' }}
            dataKey="value"
            isAnimationActive={true}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
            label={false} // Remove default labels
          >
            {getAggregateStats(selectedMetric).map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colorMap[entry.name]} 
              />
            ))}
          </RadialBar>
          <Legend
            iconSize={10}
            width={300}
            height={30}
            layout="horizontal" // Changed to horizontal layout
            verticalAlign="bottom" // Place at bottom
            align="center" // Center align
            formatter={(value, entry) => {
              // Only show the name, not the value (value will show on hover)
              return `${value}`;
            }}
          />
          <Tooltip
            formatter={(value, name, props) => [
              `${props.payload.actualValue}`, 
              `${name}`
            ]}
          />
        </RadialBarChart>
      </ResponsiveContainer>


                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 col-span-1">
                  <h3 className="text-lg font-medium text-indigo-700 mb-4">Category Comparison</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{
                          top: 20,
                          right: 20,
                          bottom: 20,
                          left: 20,
                        }}
                      >
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name="growth" unit="%" />
                        <YAxis type="number" dataKey="y" name="average" unit="" />
                        <ZAxis type="number" range={[60, 400]} dataKey="z" name="volume" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Legend />
                        {categories.slice(0, 5).map((category, index) => {
                          const stats = getAggregateStats(selectedMetric).find(s => s.name === category);
                          const categoryData = getCategoryData(category, selectedMetric);
                          const lastValue = categoryData.length > 0 ? Number(categoryData[categoryData.length - 1]?.yhat) || 0 : 0;
                          const firstValue = categoryData.length > 0 ? Number(categoryData[0]?.yhat) || 0 : 0;
                          const growth = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
                          const avg = stats?.average ? parseFloat(stats.average) : 0;
                          const volume = categoryData.reduce((sum, item) => sum + (Number(item.yhat) || 0), 0);
                        
                          return (
                            <Scatter 
                              key={category} 
                              name={category} 
                              data={[{ x: growth, y: avg, z: volume }]} 
                              fill={colorMap[category]} 
                            />
                          );
                        })}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 col-span-1">
                  <h3 className="text-lg font-medium text-indigo-700 mb-4">Forecast Insights</h3>
                  <div className="space-y-4 h-80 overflow-y-auto">
                    {categories.map((category) => {
                      const categoryData = getCategoryData(category, selectedMetric);
                      if (categoryData.length === 0) return null;
                      
                      const lastValue = Number(categoryData[categoryData.length - 1].yhat);
                      const firstValue = Number(categoryData[0].yhat);
                      const growth = firstValue === 0 ? 0 : ((lastValue - firstValue) / firstValue) * 100;
                      
                      let insight = "Steady trend";
                      let direction = "neutral";
                      
                      if (growth > 20) {
                        insight = "Strong growth potential";
                        direction = "up";
                      } else if (growth > 5) {
                        insight = "Moderate growth";
                        direction = "up";
                      } else if (growth < -20) {
                        insight = "Significant decline";
                        direction = "down";
                      } else if (growth < -5) {
                        insight = "Moderate decline";
                        direction = "down";
                      }
                      
                      return (
                      <InsightCard
                        description="df"
                        key={category}
                        title="Category Insight"
                        metric={selectedMetric}
                        category={category}
                        growth={growth.toFixed(2)}
                        color={colorMap[category]}
                        insight={[insight]} // Wrap insight in an array
                        direction={direction}
                        value={parseFloat(lastValue.toFixed(2))}
                        fullMark={Math.max(...categoryData.map((item) => Number(item.yhat) || 0))} // Example fullMark from dataset
                        categoryData={categoryData}
                        colorMap={colorMap}
                      />


                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

  );
};

export default TimeseriesPredictionChart;