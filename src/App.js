import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';


function App() {
  const [file, setFile] = useState(null);
  const [tableName, setTableName] = useState('');
  const [mappings, setMappings] = useState({});
  const [fileHeaders, setFileHeaders] = useState([]);
  const [status, setStatus] = useState('');
  const [tables, setTables] = useState([]);
  const [tableColumns, setTableColumns] = useState([]);
  const [sourceTypes, setSourceTypes] = useState({});
  // const [selectedTables, setSelectedTables] = useState([]);
  const [additionalTables, setAdditionalTables] = useState([]);
  const [additionalMappings, setAdditionalMappings] = useState({});
  const [data, setData] = useState([]);



  const [selectedTables, setSelectedTables] = useState([]);
    // const [mappings, setMappings] = useState({}); 
  // const [mappings, setMappings] = useState({});

  const [customMappings, setCustomMappings] = useState([]);
const [showCustomMappingModal, setShowCustomMappingModal] = useState(false);

const CustomMappingModal = ({ onClose, onSave, sourceColumns, destinationColumns }) => {
  const [mappingType, setMappingType] = useState('concat');
  const [sourceFields, setSourceFields] = useState([]);
  const [destinationField, setDestinationField] = useState('');
  const [separator, setSeparator] = useState(' ');
  const [preview, setPreview] = useState('');

  // Update the useEffect (around line 11 in your code)
useEffect(() => {
  if (mappingType === 'concat' && sourceFields.length > 0) {
      setPreview(true); // Just set to true since we're showing preview directly
  } else if (mappingType === 'split' && sourceFields[0]) {
      setPreview(true);
  } else {
      setPreview(false);
  }
}, [mappingType, sourceFields, destinationField, separator]);

  return (
      <div className="modal-overlay">
          <div className="modal-content">
              <div className="modal-header">
                  <h3>Custom Column Mapping</h3>
                  <button onClick={onClose} className="close-button">
                      <i className="fas fa-times"></i>
                  </button>
              </div>

              <div className="modal-body">
                  <div className="form-group">
                      <label>Mapping Type:</label>
                      <select 
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
                              <label>Source Columns to Combine:</label>
                              <select 
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
                              <small>Hold Ctrl/Cmd to select multiple columns</small>
                          </div>

                          <div className="form-group">
                              <label>Separator:</label>
                              <input 
                                  type="text"
                                  value={separator}
                                  onChange={(e) => setSeparator(e.target.value)}
                                  placeholder="Space, comma, etc."
                                  className="text-input"
                              />
                          </div>

                          <div className="form-group">
                              <label>Destination Column:</label>
                              <select
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
                              <label>Source Column to Split:</label>
                              <select
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
                              <label>Separator:</label>
                              <input 
                                  type="text"
                                  value={separator}
                                  onChange={(e) => setSeparator(e.target.value)}
                                  placeholder="Space, comma, etc."
                                  className="text-input"
                              />
                          </div>

                          <div className="form-group">
                              <label>Destination Columns:</label>
                              <select
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
                              <small>Hold Ctrl/Cmd to select multiple columns</small>
                          </div>
                      </>
                  )}

// Replace the existing preview section (around line 133 in your code)
{preview && (
    <div className="preview-section">
        <label>Preview:</label>
        <div className="preview-content">
            {mappingType === 'concat' && sourceFields.length > 0 && (
                <p>Example: "{sourceFields.join(` ${separator} `)}" → "{destinationField}"</p>
            )}
            {mappingType === 'split' && sourceFields[0] && (
                <p>Example: "{sourceFields[0]}" will be split into {
                    Array.isArray(destinationField) ? destinationField.length : 1
                } columns using "{separator}" as separator</p>
            )}
        </div>
    </div>
)}
              </div>

              <div className="modal-footer">
                  <button 
                      onClick={onClose} 
                      className="button secondary"
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
                      disabled={!sourceFields.length || !destinationField}
                  >
                      Create Mapping
                  </button>
              </div>
          </div>
      </div>
  );
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

const processCustomMapping = (data, mapping) => {
  if (mapping.type === 'concat') {
      // Combine multiple columns
      const combinedValue = mapping.sourceFields
          .map(field => data[field])
          .join(' ').trim();
      return {
          [mapping.destinationField]: combinedValue
      };
  } else if (mapping.type === 'split') {
      // Split a column into multiple parts
      const parts = data[mapping.sourceFields[0]].split(' ');
      const result = {};
      if (Array.isArray(mapping.destinationField)) {
          mapping.destinationField.forEach((field, index) => {
              result[field] = parts[index] || '';
          });
      }
      return result;
  }
  return {};
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

    // Clear mappings for unselected tables
    setAdditionalMappings(prev => {
      const newMappings = {};
      selected.forEach(table => {
        if (prev[table]) {
          newMappings[table] = prev[table];
        }
      });
      return newMappings;
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        setStatus('Starting migration...');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tableName', tableName);
        formData.append('mappings', JSON.stringify(mappings));
        formData.append('customMappings', JSON.stringify(customMappings));

        const response = await axios.post('http://localhost:5000/api/migrate', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        // Use the response
        if (response.data.success) {
            setStatus('Migration completed successfully!');
        } else {
            setStatus(`Error: ${response.data.error || 'Unknown error occurred'}`);
        }
    } catch (error) {
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

      <form onSubmit={handleSubmit}>
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

          {/* Step 2: File Upload */}
          <div className="step-section">
            <h2>Step 2: Upload Data File</h2>
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
              <h2>Step 3: Column Mapping</h2>

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
                  <h3>
                    <i className="fas fa-random"></i>
                    Primary Table Mapping ({tableName})
                  </h3>
                  <div className="auto-map-info">
                    <i className="fas fa-magic"></i>
                    Auto-mapped columns are automatically matched based on names
                  </div>
                  <div className="mappings">
                    {Object.entries(mappings).map(([sqlCol, fileCol]) => (
                      <div key={sqlCol} className="mapping-item">
                        <div className="mapping-content">
                          <span className="source-col">{fileCol}</span>
                          <i className="fas fa-arrow-right"></i>
                          <span className="target-col">{sqlCol}</span>
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
                    ))}
                    <button
                      type="button"
                      onClick={handleAddMapping}
                      className="add-mapping-btn"
                    >
                      <i className="fas fa-plus"></i> Add Column Mapping
                    </button>
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

      {/* Status Messages */}
      {status && (
        <div className={`status-message ${status.includes('Error') ? 'error' :
          status.includes('⚠️') ? 'warning' : 'success'}`}>
          <i className={`fas ${status.includes('Error') ? 'fa-exclamation-circle' :
            status.includes('⚠️') ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;