import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

import Summary from './test';



function App() {
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const [mappings, setMappings] = useState({});
  const [fileHeaders, setFileHeaders] = useState([]);
  const [status, setStatus] = useState('');
  const [tables, setTables] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [sourceTypes, setSourceTypes] = useState({});
  const [referenceData, setReferenceData] = useState({});
  const [columnMetadata, setColumnMetadata] = useState({});
  const [additionalTables, setAdditionalTables] = useState([]);
  const [additionalMappings, setAdditionalMappings] = useState({});
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedSqlColumn, setSelectedSqlColumn] = useState('');
  const [selectedFileColumn, setSelectedFileColumn] = useState('');
  const [data, setData] = useState([]);
  const [additionalTableColumns, setAdditionalTableColumns] = useState({});
  // const [migrationResults, setMigrationResults] = useState({});
  const [migrationProgress, setMigrationProgress] = useState({
    total: 0,
    processed: 0,
    skipped: 0,  // Add this to track duplicates
    failed: 0,
    status: 'idle'
  });

// Update the initial state to include all required fields
const [migrationResults, setMigrationResults] = useState({
  total: 0,
  processed: 0,
  skipped: 0,
  failed: 0,
  details: [],
  status: 'idle'
});

// Update handleMigration function
const handleMigration = async (e) => {
  e.preventDefault();
  try {
    setMigrationResults({
          total: 0,
          processed: 0,
          skipped: 0,
          failed: 0,
          status: 'in-progress'
      });
      setStatus('Migration in progress...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);
      formData.append('mappings', JSON.stringify(mappings));
      formData.append('customMappings', JSON.stringify(customMappings));
      formData.append('additionalTables', JSON.stringify(additionalTables));
      formData.append('additionalMappings', JSON.stringify(additionalMappings));

      const response = await axios.post('http://localhost:5000/api/migrate', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

    console.log('API Response:', response.data);

    if (response.data.success) {
      setMigrationProgress({
        total: response.data.totalRecords || 0,
        processed: response.data.processedRecords || 0,
        skipped: response.data.skippedRecords || 0,
        failed: response.data.failedRecords || 0,
        status: 'completed'
      });
      // Update migrationResults if available
      if (response.data.results && response.data.results.details && response.data.results.details.length > 0) {
          setMigrationResults(response.data.results);
      }
      setStatus('Migration completed successfully!');
  }  else {
        throw new Error(response.data.error || 'Migration failed');
    }
} catch (error) {
    console.error('Migration Error:', error);
    setStatus(`Error: ${error.message}`);
}
};
// Add at the top of your App component
useEffect(() => {
  console.log('Migration results updated:', migrationResults);
}, [migrationResults]);

// Add in your render method before returning JSX
console.log('Current migration results:', migrationResults);


  const [customMappings, setCustomMappings] = useState([]);
  const [showCustomMappingModal, setShowCustomMappingModal] = useState(false);

  const CustomMappingModal = ({ onClose, onSave, sourceColumns, destinationColumns }) => {
    const [mappingType, setMappingType] = useState('concat');
    const [sourceFields, setSourceFields] = useState([]);
    const [destinationField, setDestinationField] = useState('');
    const [separator, setSeparator] = useState(' ');
    const [preview, setPreview] = useState('');

    // Improved useEffect with better preview logic
    useEffect(() => {
        const hasValidSourceFields = mappingType === 'concat' ? 
            sourceFields.length >= 2 : // Concat needs at least 2 fields
            sourceFields.length === 1; // Split needs exactly 1 field

        const hasValidDestination = mappingType === 'concat' ?
            Boolean(destinationField) : // Concat needs one destination
            Array.isArray(destinationField) && destinationField.length >= 2; // Split needs at least 2 destinations

        setPreview(hasValidSourceFields && hasValidDestination);
    }, [mappingType, sourceFields, destinationField, separator]);

    // Validation function
    const isValidMapping = () => {
        if (mappingType === 'concat') {
            return sourceFields.length >= 2 && destinationField;
        } else {
            return sourceFields.length === 1 && 
                   Array.isArray(destinationField) && 
                   destinationField.length >= 2;
        }
    };

    // Reset form when mapping type changes
    useEffect(() => {
        setSourceFields([]);
        setDestinationField(mappingType === 'split' ? [] : '');
        setSeparator(' ');
    }, [mappingType]);

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Custom Column Mapping</h3>
                    <button 
                        onClick={onClose} 
                        className="close-button"
                        aria-label="Close modal"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label htmlFor="mappingType">Mapping Type:</label>
                        <select
                            id="mappingType"
                            value={mappingType}
                            onChange={(e) => setMappingType(e.target.value)}
                            className="select-input"
                        >
                            <option value="concat">Combine Multiple Columns</option>
                            <option value="split">Split Single Column</option>
                        </select>
                    </div>

                    {mappingType === 'concat' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="sourceColumns">Source Columns to Combine:</label>
                                <select
                                    id="sourceColumns"
                                    multiple
                                    value={sourceFields}
                                    onChange={(e) => setSourceFields(
                                        Array.from(e.target.selectedOptions, option => option.value)
                                    )}
                                    className="select-input"
                                >
                                    {sourceColumns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                                <small>Select at least 2 columns (Hold Ctrl/Cmd)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="separator">Separator:</label>
                                <input
                                    id="separator"
                                    type="text"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value)}
                                    placeholder="Space, comma, etc."
                                    className="text-input"
                                    maxLength={5}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="destinationColumn">Destination Column:</label>
                                <select
                                    id="destinationColumn"
                                    value={destinationField}
                                    onChange={(e) => setDestinationField(e.target.value)}
                                    className="select-input"
                                >
                                    <option value="">Select destination column</option>
                                    {destinationColumns.map(col => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group">
                                <label htmlFor="sourceColumn">Source Column to Split:</label>
                                <select
                                    id="sourceColumn"
                                    value={sourceFields[0] || ''}
                                    onChange={(e) => setSourceFields([e.target.value])}
                                    className="select-input"
                                >
                                    <option value="">Select source column</option>
                                    {sourceColumns.map(col => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="splitSeparator">Separator:</label>
                                <input
                                    id="splitSeparator"
                                    type="text"
                                    value={separator}
                                    onChange={(e) => setSeparator(e.target.value)}
                                    placeholder="Space, comma, etc."
                                    className="text-input"
                                    maxLength={5}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="destinationColumns">Destination Columns:</label>
                                <select
                                    id="destinationColumns"
                                    multiple
                                    value={destinationField}
                                    onChange={(e) => setDestinationField(
                                        Array.from(e.target.selectedOptions, option => option.value)
                                    )}
                                    className="select-input"
                                >
                                    {destinationColumns.map(col => (
                                        <option key={col.name} value={col.name}>{col.name}</option>
                                    ))}
                                </select>
                                <small>Select at least 2 columns (Hold Ctrl/Cmd)</small>
                            </div>
                        </>
                    )}

                    {preview && (
                        <div className="preview-section" role="region" aria-label="Mapping preview">
                            <label>Preview:</label>
                            <div className="preview-content">
                                {mappingType === 'concat' ? (
                                    <p>
                                        <strong>Source:</strong> {sourceFields.join(` ${separator} `)}
                                        <br />
                                        <strong>Destination:</strong> {destinationField}
                                    </p>
                                ) : (
                                    <p>
                                        <strong>Source:</strong> {sourceFields[0]}
                                        <br />
                                        <strong>Will split into:</strong> {
                                            Array.isArray(destinationField) 
                                                ? destinationField.join(', ') 
                                                : 'No columns selected'
                                        }
                                        <br />
                                        <strong>Using separator:</strong> "{separator}"
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button
                        onClick={onClose}
                        className="button secondary"
                        type="button"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({
                            type: mappingType,
                            sourceFields,
                            destinationField,
                            separator
                        })}
                        className="button primary"
                        disabled={!isValidMapping()}
                        type="button"
                    >
                        Create Mapping
                    </button>
                </div>
            </div>
        </div>
    );
};




  const MigrationProgress = ({ progress }) => {
    const getStatusColor = () => {
      switch (progress.status) {
        case 'completed': return 'var(--success-color, #28a745)';
        case 'failed': return 'var(--error-color, #dc3545)';
        case 'in-progress': return 'var(--primary-color, #007bff)';
        default: return 'var(--text-color, #666)';
      }
    };

    if (progress.status === 'idle') return null;

    return (
      <div className="migration-progress">
        <div className="progress-header">
          <h3>Migration Progress</h3>
          <span className="status-badge" style={{ backgroundColor: getStatusColor() }}>
            {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
          </span>
        </div>

        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">Total Records</span>
            <span className="stat-value">{progress.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Processed</span>
            <span className="stat-value">{progress.processed}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Skipped (Duplicates)</span>
            <span className="stat-value">{progress.skipped}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Failed</span>
            <span className="stat-value">{progress.failed}</span>
          </div>
        </div>

        {progress.status === 'in-progress' && (
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${(progress.processed / progress.total) * 100}%`
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const ReferenceFieldMapping = ({ column, value, onChange }) => {
    if (column.isForeignKey) {
      return (
        <div className="mapping-item">
          <div className="mapping-content">
            <span className="source-col">
              <select
                value={value || ''}
                onChange={(e) => onChange(column.name, e.target.value)}
                className="select-input"
              >
                <option value="">Select source column</option>
                {fileHeaders.map(header => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </span>
            <i className="fas fa-arrow-right"></i>
            <span className="target-col">
              {column.name}
              <small className="reference-info">
                (Links to {column.referencedTable})
              </small>
            </span>
          </div>
        </div>
      );
    }
    return null;
  };



  // Update your fetchTableColumns function
  const fetchTableColumns = async (selectedTable) => {
    try {
      console.log('Fetching columns for:', selectedTable);
      const response = await axios.get(`http://localhost:5000/api/columns/${selectedTable}`);
      console.log('API Response:', response.data);

      if (response.data.success) {
        setTableColumns(response.data.columns);
        if (response.data.metadata) {
          console.log('Setting metadata:', response.data.metadata);
          setColumnMetadata(response.data.metadata);
        }
      }
    } catch (error) {
      console.error('Error fetching columns:', error);
      setStatus(`Error fetching columns: ${error.message}`);
    }
  };

  // Add this useEffect to monitor changes
  useEffect(() => {
    if (tableName) {
      fetchTableColumns(tableName);
    }
  }, [tableName]);

  useEffect(() => {
    console.log('Updated columnMetadata:', columnMetadata);
  }, [columnMetadata]);
  const fetchReferenceData = async (tableName) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reference/${tableName}`);
      setReferenceData(prev => ({
        ...prev,
        [tableName]: response.data
      }));
    } catch (error) {
      setStatus(`Error fetching reference data: ${error.message}`);
    }
  };


  useEffect(() => {
    fetchTables();
  }, []);

  const fetchColumns = async (selectedTable) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/columns/${selectedTable}`);
      if (response.data.success) {
        setTableColumns(response.data.columns);
      }
    } catch (error) {
      setStatus(`Error fetching columns: ${error.message}`);
    }
  };
  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tables');
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      setStatus(`Error fetching tables: ${error.message}`);
    }
  };

  const handleAddMapping = () => {
    const sqlColumn = prompt('Enter SQL column name:');
    const fileColumn = prompt('Select file column:', fileHeaders.join(', '));

    if (sqlColumn && fileColumn) {
      setMappings({
        ...mappings,
        [sqlColumn]: fileColumn
      });
    }
  };

  const handleTableChange = (e) => {
    const selectedTable = e.target.value;
    setTableName(selectedTable);
    if (selectedTable) {
      fetchColumns(selectedTable);
    } else {
      setTableColumns([]);
    }
  };
  const handleUpdateMapping = (sqlCol) => {
    const newFileCol = prompt('Select file column:', fileHeaders.join(', '));
    if (newFileCol) {
      setMappings({
        ...mappings,
        [sqlCol]: newFileCol
      });
    }
  };

  const handleDeleteMapping = (sqlCol) => {
    const newMappings = { ...mappings };
    delete newMappings[sqlCol];
    setMappings(newMappings);
  };






  const validateDataTypes = (fileData, tableColumns, mappings) => {
    const errors = [];

    // Check first row of data for type matching
    if (fileData.length > 0) {
      const firstRow = fileData[0];

      Object.entries(mappings).forEach(([sqlCol, fileCol]) => {
        const tableColumn = tableColumns.find(col => col.name === sqlCol);
        if (!tableColumn) return;

        const value = firstRow[fileCol];

        switch (tableColumn.type.toLowerCase()) {
          case 'int':
          case 'bigint':
          case 'smallint':
            if (value && isNaN(Number(value))) {
              errors.push(`Column "${fileCol}" contains non-numeric data but should be ${tableColumn.type}`);
            }
            break;

          case 'decimal':
          case 'float':
          case 'numeric':
            if (value && isNaN(Number(value))) {
              errors.push(`Column "${fileCol}" contains non-numeric data but should be ${tableColumn.type}`);
            }
            break;

          case 'date':
          case 'datetime':
            if (value && isNaN(Date.parse(value))) {
              errors.push(`Column "${fileCol}" contains invalid date format but should be ${tableColumn.type}`);
            }
            break;

          case 'varchar':
          case 'nvarchar':
            if (value && tableColumn.maxLength && value.length > tableColumn.maxLength) {
              errors.push(`Column "${fileCol}" contains data longer than maximum length ${tableColumn.maxLength}`);
            }
            break;
        }
      });
    }

    return errors;
  };


  const detectDataType = (value) => {
    if (value === null || value === undefined || value === '') return 'NULL';

    // Remove any whitespace
    value = value.toString().trim();

    // Check if it's a number first (employee numbers are often numeric)
    if (!isNaN(value) && !value.includes('.')) {
      return 'INTEGER';
    }

    // Check for decimal numbers
    if (!isNaN(value) && value.includes('.')) {
      return 'DECIMAL';
    }

    // More strict date checking
    const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
    if (dateRegex.test(value) && !isNaN(Date.parse(value))) {
      return 'DATE';
    }

    // If none of the above, it's likely a string
    return 'VARCHAR';
  };
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target.result;
        let headers = [];
        let data = [];
        let firstDataRow = {};
        let sourceDataTypes = {};
        if (selectedFile.name.endsWith('.csv')) {
          const lines = content.split('\n');
          headers = lines[0].split(',').map(h => h.trim());

          if (lines.length > 1) {
            const values = lines[1].split(',');
            headers.forEach((header, index) => {
              firstDataRow[header] = values[index]?.trim();
              sourceDataTypes[header] = detectDataType(values[index]?.trim());
            });
          }
        }
        setFileHeaders(headers);
        setSourceTypes(sourceDataTypes);

        // Auto mapping for primary table
        const autoMappings = {};
        tableColumns.forEach(tableCol => {
          const match = headers.find(
            fileCol => fileCol.toLowerCase() === tableCol.name.toLowerCase()
          );
          if (match) {
            autoMappings[tableCol.name] = match;
          }
        });

        // Validate and set primary table mappings
        const validationErrors = validateDataTypes(data, tableColumns, autoMappings);
        if (validationErrors.length > 0) {
          setStatus('⚠️ Data Type Warnings:\n' + validationErrors.join('\n'));
        } else {
          setStatus('✅ Data types validated successfully');
        }
        setMappings(autoMappings);

        // Auto mapping for additional tables
        const newAdditionalMappings = {};
        for (const addTable of additionalTables) {
          const addTableColumns = await fetchAdditionalTableColumns(addTable);
          const addTableMappings = {};

          addTableColumns.forEach(tableCol => {
            const match = headers.find(
              fileCol => fileCol.toLowerCase() === tableCol.name.toLowerCase()
            );
            if (match) {
              addTableMappings[tableCol.name] = match;
            }
          });

          if (Object.keys(addTableMappings).length > 0) {
            newAdditionalMappings[addTable] = addTableMappings;
          }
        }

        setAdditionalMappings(prev => ({
          ...prev,
          ...newAdditionalMappings
        }));
      };

      reader.readAsText(selectedFile);
    }
  };

  const checkTypeCompatibility = (sourceType, destType) => {
    if (!sourceType || !destType) return false;

    // Convert types to uppercase for comparison
    sourceType = sourceType.toUpperCase();
    destType = destType.toUpperCase();

    // Define type compatibility rules
    const compatibilityRules = {
      'VARCHAR': ['VARCHAR', 'NVARCHAR', 'TEXT', 'CHAR', 'NCHAR'],
      'INTEGER': ['INT', 'BIGINT', 'SMALLINT', 'DECIMAL', 'NUMERIC'],
      'DECIMAL': ['DECIMAL', 'NUMERIC', 'FLOAT', 'REAL'],
      'DATE': ['DATE', 'DATETIME', 'DATETIME2', 'SMALLDATETIME'],
      'NULL': ['VARCHAR', 'NVARCHAR', 'INT', 'BIGINT', 'DATE', 'DATETIME'] // NULL can go into any type
    };

    return compatibilityRules[sourceType]?.includes(destType) || false;
  };



  const handleAddAdditionalMapping = (tableName) => {
    const sqlColumn = prompt('Enter SQL column name:');
    const fileColumn = prompt('Select file column:', fileHeaders.join(', '));

    if (sqlColumn && fileColumn) {
      setAdditionalMappings(prev => ({
        ...prev,
        [tableName]: {
          ...(prev[tableName] || {}),
          [sqlColumn]: fileColumn
        }
      }));
    }
  };

  const handleUpdateAdditionalMapping = (tableName, sqlCol) => {
    const newFileCol = prompt('Select file column:', fileHeaders.join(', '));
    if (newFileCol) {
      setAdditionalMappings(prev => ({
        ...prev,
        [tableName]: {
          ...(prev[tableName] || {}),
          [sqlCol]: newFileCol
        }
      }));
    }
  };

  const handleDeleteAdditionalMapping = (tableName, sqlCol) => {
    setAdditionalMappings(prev => {
      const tableMapping = { ...prev[tableName] };
      delete tableMapping[sqlCol];
      return {
        ...prev,
        [tableName]: tableMapping
      };
    });
  };


  const fetchAdditionalTableColumns = async (tableName) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/columns/${tableName}`);
      if (response.data.success) {
        return response.data.columns;
      }
      return [];
    } catch (error) {
      setStatus(`Error fetching columns for ${tableName}: ${error.message}`);
      return [];
    }
  };
  const handleAdditionalTablesChange = async (e) => {
    const selected = Array.from(e.target.selectedOptions, option => option.value);
    setAdditionalTables(selected);

    // Fetch columns for newly selected tables
    for (const table of selected) {
      if (!additionalTableColumns[table]) {
        try {
          const columns = await fetchAdditionalTableColumns(table);
          setAdditionalTableColumns(prev => ({
            ...prev,
            [table]: columns
          }));

          // Auto-map columns for newly added table
          if (fileHeaders.length > 0) {
            const autoMappings = {};
            columns.forEach(tableCol => {
              const match = fileHeaders.find(
                fileCol => fileCol.toLowerCase() === tableCol.name.toLowerCase()
              );
              if (match) {
                autoMappings[tableCol.name] = match;
              }
            });

            if (Object.keys(autoMappings).length > 0) {
              setAdditionalMappings(prev => ({
                ...prev,
                [table]: autoMappings
              }));
            }
          }
        } catch (error) {
          setStatus(`Error fetching columns for ${table}: ${error.message}`);
        }
      }
    }
    setAdditionalMappings(prev => {
      const newMappings = {};
      selected.forEach(table => {
        if (prev[table]) {
          newMappings[table] = prev[table];
        }
      });
      return newMappings;
    });

    // Clean up stored columns for unselected tables
    setAdditionalTableColumns(prev => {
      const newColumns = {};
      selected.forEach(table => {
        if (prev[table]) {
          newColumns[table] = prev[table];
        }
      });
      return newColumns;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setMigrationProgress({
        total: 0,
        processed: 0,
        skipped: 0,
        failed: 0,
        status: 'in-progress'
      });
      setStatus('Starting migration...');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tableName', tableName);
      formData.append('mappings', JSON.stringify(mappings));
      formData.append('customMappings', JSON.stringify(customMappings));
      formData.append('additionalTables', JSON.stringify(additionalTables));
      formData.append('additionalMappings', JSON.stringify(additionalMappings));

      // Set up progress tracking
      const response = await axios.post('http://localhost:5000/api/migrate', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setStatus(`Uploading file: ${percentCompleted}%`);
        }
      });

      if (response.data.success) {
        setMigrationProgress({
          total: response.data.totalRecords || 0,
          processed: response.data.processedRecords || 0,
          skipped: response.data.skippedRecords || 0,
          failed: response.data.failedRecords || 0,
          status: 'completed'
        });
        setStatus('Migration completed successfully!');
      } else {
        setMigrationProgress(prev => ({ ...prev, status: 'failed' }));
        setStatus(`Error: ${response.data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      setMigrationProgress(prev => ({ ...prev, status: 'failed' }));
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
      console.error('Full error:', error);
    }
  };




  return (
    <div className="container">
      <header className="header">
        <h1>Data Migration Tool</h1>
        <p className="subtitle">Import and map your data across multiple tables</p>
      </header>

      <form onSubmit={handleMigration}>
        <div className="migration-setup">
          {/* Step 1: Table Selection */}
          <div className="step-section">
            <h2>Step 1: Select Tables</h2>

            <div className="form-group">
              <label>
                <i className="fas fa-table"></i> Primary Table:
                <span className="required">*</span>
              </label>
              <select
                value={tableName}
                onChange={handleTableChange}
                className="select-primary"
              >
                <option value="">Select a table</option>
                {tables.map(table => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-database"></i> Additional Tables:
                <span className="helper-text">Optional - Select tables for related data</span>
              </label>
              <select
                multiple
                value={additionalTables}
                onChange={handleAdditionalTablesChange}
                className="select-additional"
              >
                {tables.map(table => (
                  <option key={table} value={table}>
                    {table}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {file && (
            <div className="step-section">
              <h2>
                <i className="fas fa-table"></i>
                Step 2: Preview Data
              </h2>
              <div className="file-info">
                <div className="file-details">
                  <i className="fas fa-file-csv"></i>
                  <span>{file.name}</span>
                  <small>({(file.size / 1024).toFixed(2)} KB)</small>
                </div>
                {fileHeaders.length > 0 && (
                  <div className="csv-preview">
                    <h3>CSV Columns:</h3>
                    <div className="column-list">
                      {fileHeaders.map(header => (
                        <span key={header} className="column-chip">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Step 2: File Upload */}
          <div className="step-section">
            <h2>Step 3: Upload Data File</h2>
            <div className="form-group file-upload">
              <label>
                <i className="fas fa-file-upload"></i> Upload File (CSV or Excel)
                <span className="required">*</span>
              </label>
              <div className="upload-zone">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  id="file-input"
                />
                <label htmlFor="file-input" className="upload-label">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Drag & drop or click to select file</span>
                </label>
              </div>
            </div>
          </div>
          <div className="custom-mapping-section">
            <button
              type="button"
              onClick={() => setShowCustomMappingModal(true)}
              className="custom-mapping-btn"
            >
              <i className="fas fa-columns"></i>
              Create Custom Column Mapping
            </button>
          </div>

          {/* Add the modal */}
          {showCustomMappingModal && (
            <CustomMappingModal
              onClose={() => setShowCustomMappingModal(false)}
              onSave={(mapping) => {
                setCustomMappings([...customMappings, mapping]);
                setShowCustomMappingModal(false);
              }}
              sourceColumns={fileHeaders}
              destinationColumns={tableColumns}
            />
          )}

          {fileHeaders.length > 0 && tableColumns.length > 0 && (
            <div className="step-section">
              <h2>
                <i className="fas fa-columns"></i>
                Column Comparison
              </h2>
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Source Column</th>
                      <th>Source Type</th>
                      <th>Status</th>
                      <th>Destination Column</th>
                      <th>Destination Type</th>
                      <th>Type Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fileHeaders.map(sourceCol => {
                      const mappedToCol = Object.entries(mappings)
                        .find(([_, fileCol]) => fileCol === sourceCol);

                      const matchingDestCol = tableColumns
                        .find(col => col.name.toLowerCase() === sourceCol.toLowerCase());

                      const sourceType = sourceTypes[sourceCol];
                      const destType = mappedToCol ?
                        tableColumns.find(col => col.name === mappedToCol[0])?.type :
                        matchingDestCol?.type;

                      const isTypeCompatible = checkTypeCompatibility(sourceType, destType);

                      return (
                        <tr key={sourceCol} className={mappedToCol ? 'mapped' : 'unmapped'}>
                          <td>{sourceCol}</td>
                          <td className="type-cell">
                            <span className="data-type source">
                              {sourceType}
                            </span>
                          </td>
                          <td className="status-cell">
                            {mappedToCol ? (
                              <span className="status-mapped">
                                <i className="fas fa-check-circle"></i> Mapped
                              </span>
                            ) : matchingDestCol ? (
                              <span className="status-available">
                                <i className="fas fa-info-circle"></i> Available
                              </span>
                            ) : (
                              <span className="status-unmapped">
                                <i className="fas fa-exclamation-circle"></i> No Match
                              </span>
                            )}
                          </td>
                          <td>
                            {mappedToCol ? (
                              <strong>{mappedToCol[0]}</strong>
                            ) : matchingDestCol ? (
                              <span className="suggested">{matchingDestCol.name}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="type-cell">
                            {destType || '—'}
                          </td>
                          <td className="compatibility-cell">
                            {destType && (
                              <span className={`type-compatibility ${isTypeCompatible ? 'compatible' : 'incompatible'}`}>
                                <i className={`fas ${isTypeCompatible ? 'fa-check' : 'fa-exclamation-triangle'}`}></i>
                                {isTypeCompatible ? 'Compatible' : 'Warning'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Step 3: Column Mapping */}
          {(fileHeaders.length > 0 || tableColumns.length > 0) && (
            <div className="step-section">
              <h2>Step 4: Column Mapping</h2>

              {/* Source Columns Preview */}
              <div className="columns-preview">
                <div className="preview-section">
                  <h3>Source File Columns</h3>
                  <div className="columns-list source">
                    {fileHeaders.map(header => (
                      <div key={header} className="column-item">
                        <i className="fas fa-file-alt"></i>
                        {header}
                      </div>
                    ))}
                  </div>
                </div>
              </div>


              {/* Primary Table Mapping */}
              {tableColumns.length > 0 && (
                <div className="mapping-section">
                  {console.log('Current columnMetadata:', columnMetadata)} {/* Debug log */}
                  <h3>
                    <i className="fas fa-random"></i>
                    Primary Table Mapping ({tableName})
                  </h3>
                  <div className="auto-map-info">
                    <i className="fas fa-magic"></i>
                    Auto-mapped columns are automatically matched based on names
                  </div>
                  <div className="mappings">
                    {Object.entries(mappings).map(([sqlCol, fileCol]) => {
                      const columnMeta = columnMetadata[sqlCol];
                      console.log('Column metadata for', sqlCol, ':', columnMeta);

                      return (
                        <div key={sqlCol} className="mapping-item">
                          <div className={`mapping-content ${columnMeta?.isForeignKey ? 'foreign-key' : ''}`}>
                            <span className="source-col">{fileCol}</span>
                            <i className="fas fa-arrow-right"></i>
                            <span className="target-col">
                              {sqlCol}
                              {columnMeta?.isForeignKey && (
                                <div className="foreign-key-badge">
                                  FK → {columnMeta.referencedTable}
                                </div>
                              )}
                            </span>
                          </div>
                          <div className="mapping-actions">
                            <button
                              type="button"
                              onClick={() => handleUpdateMapping(sqlCol)}
                              className="action-button edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMapping(sqlCol)}
                              className="action-button delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowMappingModal(true)}
                      className="add-mapping-btn"
                    >
                      <i className="fas fa-plus"></i> Add Column Mapping
                    </button>
                  </div>
                </div>
              )}

              {/* Mapping Modal */}
              {showMappingModal && (
                <div className="modal">
                  <div className="modal-content">
                    <h3>Add Column Mapping</h3>
                    <div className="mapping-form">
                      <select
                        value={selectedSqlColumn}
                        onChange={(e) => setSelectedSqlColumn(e.target.value)}
                        className="select-input"
                      >
                        <option value="">Select Target Column</option>
                        {tableColumns.map(column => (
                          <option key={column.name} value={column.name}>
                            {column.name}
                            {columnMetadata[column.name]?.isForeignKey ?
                              ` (Links to ${columnMetadata[column.name].referencedTable})` :
                              ''}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedFileColumn}
                        onChange={(e) => setSelectedFileColumn(e.target.value)}
                        className="select-input"
                      >
                        <option value="">Select Source Column</option>
                        {fileHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                      {columnMetadata[selectedSqlColumn]?.isForeignKey && (
                        <div className="foreign-key-info">
                          <i className="fas fa-info-circle"></i>
                          This column references {columnMetadata[selectedSqlColumn].referencedTable}.
                          Make sure your source data matches the reference values.
                        </div>
                      )}
                    </div>
                    <div className="modal-actions">
                      <button onClick={() => setShowMappingModal(false)} className="cancel-btn">
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (selectedSqlColumn && selectedFileColumn) {
                            handleUpdateMapping(selectedSqlColumn, selectedFileColumn);
                            setShowMappingModal(false);
                            setSelectedSqlColumn('');
                            setSelectedFileColumn('');
                          }
                        }}
                        className="confirm-btn"
                        disabled={!selectedSqlColumn || !selectedFileColumn}
                      >
                        Add Mapping
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Tables Mapping */}
              {additionalTables.map(addTable => (
                <div key={addTable} className="mapping-section additional">
                  <h3>
                    <i className="fas fa-table"></i>
                    {addTable} Mapping
                  </h3>
                  <div className="mappings">
                    {Object.entries(additionalMappings[addTable] || {}).map(([sqlCol, fileCol]) => (
                      <div key={sqlCol} className="mapping-item">
                        <div className="mapping-content">
                          <span className="source-col">{fileCol}</span>
                          <i className="fas fa-arrow-right"></i>
                          <span className="target-col">{sqlCol}</span>
                        </div>
                        <div className="mapping-actions">
                          <button
                            type="button"
                            onClick={() => handleUpdateAdditionalMapping(addTable, sqlCol)}
                            className="action-button edit"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAdditionalMapping(addTable, sqlCol)}
                            className="action-button delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddAdditionalMapping(addTable)}
                      className="add-mapping-btn"
                    >
                      <i className="fas fa-plus"></i> Add Column Mapping
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>



        <div className="migration-action">
          {/* Migration Summary */}
          {file && tableName && Object.keys(mappings).length > 0 && (
            <div className="migration-summary">
              <div className="summary-item">
                <i className="fas fa-file-alt"></i>
                <span>Source: {file.name}</span>
              </div>
              <div className="summary-item">
                <i className="fas fa-table"></i>
                <span>Primary Table: {tableName}</span>
              </div>
              <div className="summary-item">
                <i className="fas fa-random"></i>
                <span>Mapped Columns: {Object.keys(mappings).length}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || !tableName || Object.keys(mappings).length === 0}
            className="submit-button"
          >
            <div className="button-content">
              <i className="fas fa-database"></i>
              <span>Start Migration</span>
              {(!file || !tableName || Object.keys(mappings).length === 0) && (
                <div className="missing-requirements">
                  {!file && <span>• Upload a file</span>}
                  {!tableName && <span>• Select a table</span>}
                  {Object.keys(mappings).length === 0 && <span>• Map columns</span>}
                </div>
              )}
            </div>
          </button>
        </div>
      </form>

     

        {/* Only show Summary when we have actual results */}
        {migrationResults && 
         migrationResults.details && 
         migrationResults.details.length > 0 && (
            <Summary results={migrationResults} />
        )}

        {/* Status message */}
        {status && (
            <div className={`status-message ${status.includes('Error') ? 'error' : 'success'}`}>
                {status}
            </div>
        )}
      
    </div>
  );
}

export default App;