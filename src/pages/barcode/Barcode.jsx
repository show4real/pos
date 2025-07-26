import React, { Component } from "react";
import { Input, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { getbarcodes, updateBarcode } from "../../services/brandService";
import { toast } from "react-toastify";

import {
  Col,
  Row,
  Card,
  Table,
  Button,
  ButtonGroup,
  Breadcrumb,
  Form,
  FormControl,
  FormGroup,
  FormLabel,
  Alert,
} from "@themesberg/react-bootstrap";

import SpinDiv from "../components/SpinDiv";
import { editBarcode } from "../../services/purchaseOrderService";
import EditBarcode from "../purchase/EditBarcode";

export class Barcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      barcodes: [],
      value: "",
      total: 0,
      selectedBarcodes: new Set(),
      selectAll: false,
      showEditModal: false,
      editingBarcode: null,
      editFormData: {
        barcode: "",
        product_name: "",
        id:""
      },
      scannerInput: "",
      scannerMode: false,
      updating: false,
      printing: false,
    };
    
    // Ref for scanner input
    this.scannerInputRef = React.createRef();
  }

  componentDidMount() {
    this.getBarcodes();
    // Add event listener for scanner input
    document.addEventListener('keydown', this.handleScannerInput);
  }

  componentWillUnmount() {
    // Remove event listener
    document.removeEventListener('keydown', this.handleScannerInput);
  }

  // Handle barcode scanner input
  handleScannerInput = (e) => {
    if (!this.state.scannerMode) return;
    
    // Most barcode scanners end with Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      this.searchByBarcode(this.state.scannerInput);
      this.setState({ scannerInput: "" });
    } else if (e.key.length === 1) {
      // Add character to scanner input
      this.setState(prevState => ({
        scannerInput: prevState.scannerInput + e.key
      }));
    }
  };

  searchByBarcode = (barcode) => {
    if (!barcode.trim()) return;
    
    this.setState({ search: barcode.trim() }, () => {
      this.getBarcodes();
    });
  };

  showToast = (msg, type = "success") => {
    const color = type === "error" ? "red" : "green";
    toast(<div style={{ padding: 20, color }}>{msg}</div>);
  };

  getBarcodes = () => {
    const { page, rows, search } = this.state;
    this.setState({ loading: true });
    getbarcodes({ page, rows, search }).then(
      (res) => {
        this.setState({
          loading: false,
          barcodes: res.barcodes.data,
          total: res.barcodes.total,
          selectedBarcodes: new Set(), // Reset selection
          selectAll: false,
        });
      },
      (error) => {
        this.setState({ loading: false });
        this.showToast("Error loading barcodes", "error");
      }
    );
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  // Handle individual barcode selection
  handleBarcodeSelect = (barcodeId) => {
    this.setState(prevState => {
      const newSelected = new Set(prevState.selectedBarcodes);
      if (newSelected.has(barcodeId)) {
        newSelected.delete(barcodeId);
      } else {
        newSelected.add(barcodeId);
      }
      
      const selectAll = newSelected.size === prevState.barcodes.length;
      
      return {
        selectedBarcodes: newSelected,
        selectAll
      };
    });
  };

  // Handle select all toggle
  handleSelectAll = () => {
    this.setState(prevState => {
      if (prevState.selectAll) {
        return {
          selectedBarcodes: new Set(),
          selectAll: false
        };
      } else {
        const allIds = new Set(prevState.barcodes.map(b => b.id || b.barcode));
        return {
          selectedBarcodes: allIds,
          selectAll: true
        };
      }
    });
  };

  // Generate Code 128 barcode pattern
  generateBarcodePattern = (text) => {
    // Simplified Code 128 pattern generator
    // This creates a visual representation similar to Code 128
    const patterns = {
      '0': '11011001100', '1': '11001101100', '2': '11001100110', '3': '10010011000',
      '4': '10010001100', '5': '10001001100', '6': '10011001000', '7': '10011000100',
      '8': '10001100100', '9': '11001001000', 'A': '11001000100', 'B': '11000100100',
      'C': '10110011100', 'D': '10011011100', 'E': '10011001110', 'F': '10111001000',
      'G': '10011101000', 'H': '10011100100', 'I': '11001110010', 'J': '11001011100',
      'K': '11001001110', 'L': '11011100100', 'start': '11010000100', 'stop': '1100011101011'
    };
    
    let result = patterns.start || '11010000100';
    for (let char of text.toUpperCase()) {
      result += patterns[char] || patterns['0'];
    }
    result += patterns.stop;
    
    return result;
  };

  // Generate printable barcode HTML with proper A4 layout
  generatePrintHTML = (barcodesToPrint) => {
    const barcodeHtml = barcodesToPrint.map(barcode => {
      const pattern = this.generateBarcodePattern(barcode.barcode);
      const bars = pattern.split('').map((bit, index) => 
        `<div class="bar ${bit === '1' ? 'black' : 'white'}" key="${index}"></div>`
      ).join('');
      
      return `
        <div class="barcode-container">
          <div class="barcode-visual">
            ${bars}
          </div>
          <div class="barcode-text">${barcode.barcode}</div>
          <div class="product-name">${barcode.product_name}</div>
        </div>
      `;
    }).join('');

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Print - A4</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
              background: white;
            }
            
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            
            .print-header h1 {
              margin: 0;
              font-size: 24px;
              color: #333;
            }
            
            .print-header p {
              margin: 5px 0 0 0;
              color: #666;
              font-size: 14px;
            }
            
            .barcode-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              width: 100%;
            }
            
            .barcode-container {
              border: 2px solid #000;
              padding: 15px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
              border-radius: 5px;
            }
            
            .barcode-visual {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 60px;
              margin: 10px 0;
              background: white;
              border: 1px solid #ddd;
              overflow: hidden;
            }
            
            .bar {
              height: 50px;
              min-width: 1px;
              flex: 0 0 auto;
            }
            
            .bar.black {
              background-color: #000;
              width: 2px;
            }
            
            .bar.white {
              background-color: white;
              width: 1px;
            }
            
            .barcode-text {
              font-family: 'Courier New', monospace;
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
              color: #000;
              letter-spacing: 1px;
            }
            
            .product-name {
              font-size: 12px;
              color: #333;
              margin-top: 8px;
              word-wrap: break-word;
              line-height: 1.3;
              max-height: 40px;
              overflow: hidden;
            }
            
            @media print {
              .no-print {
                display: none !important;
              }
              
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .barcode-container {
                break-inside: avoid;
              }
            }
            
            @media screen {
              body {
                padding: 20px;
                background: #f5f5f5;
              }
              
              .no-print {
                background: #fff;
                padding: 20px;
                margin-bottom: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              
              .print-area {
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                max-width: 210mm;
                margin: 0 auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <h2>📄 Barcode Print Preview</h2>
            <p><strong>Print Instructions:</strong></p>
            <ul>
              <li>Press <kbd>Ctrl+P</kbd> (Windows) or <kbd>Cmd+P</kbd> (Mac) to print</li>
              <li>Make sure to select "More settings" → "Options" → "Background graphics" for best results</li>
              <li>Recommended: Use A4 paper size</li>
            </ul>
            <button onclick="window.print()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;">🖨️ Print Now</button>
            <hr style="margin: 20px 0;">
          </div>
          
          <div class="print-area">
            <div class="print-header">
              <h1>📋 Product Barcodes</h1>
              <p>Generated on ${new Date().toLocaleDateString()} | Total: ${barcodesToPrint.length} items</p>
            </div>
            
            <div class="barcode-grid">
              ${barcodeHtml}
            </div>
          </div>
        </body>
      </html>
    `;
    return printContent;
  };

  // Print single barcode
  printSingleBarcode = (barcode) => {
    this.setState({ printing: true });
    
    try {
      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      const printContent = this.generatePrintHTML([barcode]);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      this.showToast("Print dialog opened");
    } catch (error) {
      this.showToast("Error opening print dialog", "error");
    } finally {
      this.setState({ printing: false });
    }
  };

  // Print selected barcodes
  printSelectedBarcodes = () => {
    const { selectedBarcodes, barcodes } = this.state;
    
    if (selectedBarcodes.size === 0) {
      this.showToast("Please select barcodes to print", "error");
      return;
    }

    this.setState({ printing: true });
    
    try {
      const barcodesToPrint = barcodes.filter(b => 
        selectedBarcodes.has(b.id || b.barcode)
      );
      
      const printWindow = window.open('', '_blank', 'width=1000,height=800');
      const printContent = this.generatePrintHTML(barcodesToPrint);
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Auto-trigger print dialog after content loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
      
      this.showToast(`Print dialog opened for ${selectedBarcodes.size} barcode(s)`);
    } catch (error) {
      this.showToast("Error opening print dialog", "error");
    } finally {
      this.setState({ printing: false });
    }
  };

  // Open edit modal
  openEditModal = (barcode) => {
    this.setState({
      showEditModal: true,
      editingBarcode: barcode,
      editFormData: {
        barcode: barcode.barcode,
        product_name: barcode.product_name,
        id:barcode.id
      }
    });
  };

  // Close edit modal
  closeEditModal = () => {
    this.setState({
      showEditModal: false,
      editingBarcode: null,
      editFormData: {
        barcode: "",
        product_name: "",
        id:""
      }
    });
    this.getBarcodes()
  };

  // Handle successful edit - this will be passed to EditBarcode component
  handleEditSuccess = () => {
    this.setState({
      showEditModal: false,
      editingBarcode: null,
      editFormData: {
        barcode: "",
        product_name: "",
        id: ""
      },
      updating: false
    }, () => {
      // This callback runs after the state is updated
      this.getBarcodes();
    });
  };

  // Handle edit form changes
  handleEditFormChange = (field, value) => {
    this.setState(prevState => ({
      editFormData: {
        ...prevState.editFormData,
        [field]: value
      }
    }));
  };

  // Update barcode - FIXED VERSION
  updateBarcodeData = async () => {
    const { editingBarcode, editFormData } = this.state;
    
    if (!editFormData.barcode.trim() || !editFormData.product_name.trim()) {
      this.showToast("Please fill in all fields", "error");
      return;
    }

    this.setState({ updating: true });
    try {
      const updateData = {
        barcode: editFormData.barcode.trim(),
        id: editingBarcode.id || editingBarcode.barcode,
        product_name: editFormData.product_name.trim(),
      };
      
      await editBarcode(updateData);
      this.showToast("Barcode updated successfully");
      
      // Close modal and refresh data using the new method
      this.handleEditSuccess();
      
    } catch (error) {
      this.showToast("Error updating barcode", "error");
      this.setState({ updating: false });
    }
  };

  toggleScannerMode = () => {
    this.setState(prevState => ({
      scannerMode: !prevState.scannerMode,
      scannerInput: ""
    }));
  };

  render() {
    const {
      barcodes,
      total,
      search,
      loading,
      selectedBarcodes,
      selectAll,
      showEditModal,
      editFormData,
      scannerMode,
      scannerInput,
      updating,
      printing
    } = this.state;

    return (
      <>
        {loading && <SpinDiv text={"Loading..."} />}
        
        <Row>
          <Col lg="12">
            <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center py-4">
              <div className="d-block mb-4 mb-md-0">
                <Breadcrumb
                  listProps={{
                    className: "breadcrumb-text-dark text-primary",
                  }}
                >
                  <Breadcrumb.Item href="/">🏠 Home</Breadcrumb.Item>
                  <Breadcrumb.Item href="#products">📊 Barcodes</Breadcrumb.Item>
                </Breadcrumb>
              </div>
              <div className="btn-toolbar mb-2 mb-md-0">
                <ButtonGroup className="me-2">
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => this.props.history.push('/products')}
                  >
                    📦 Products
                  </Button>
                  <Button
                    variant={scannerMode ? "primary" : "outline-secondary"}
                    size="sm"
                    onClick={this.toggleScannerMode}
                  >
                    📱 Scanner {scannerMode ? "ON" : "OFF"}
                  </Button>
                </ButtonGroup>
                {selectedBarcodes.size > 0 && (
                  <ButtonGroup>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={this.printSelectedBarcodes}
                      disabled={printing}
                    >
                      🖨️ Print Selected ({selectedBarcodes.size})
                    </Button>
                  </ButtonGroup>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {scannerMode && (
          <Row className="mb-3">
            <Col lg="12">
              <Alert variant="info" className="d-flex align-items-center">
                ℹ️ Scanner mode is active. Scan a barcode or type manually: 
                <strong className="ms-2">{scannerInput}</strong>
              </Alert>
            </Col>
          </Row>
        )}

        <Row className="mb-4">
          <Col lg="6">
            <h5 className="mb-0">
              📊 Barcodes ({total})
            </h5>
          </Col>
          <Col lg="6">
            <div className="d-flex justify-content-end">
              <FormControl
                type="text"
                placeholder="Search by barcode or product name..."
                className="me-2"
                style={{ maxWidth: "300px" }}
                value={search}
                onChange={(e) => this.onChange(e.target.value, "search")}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    this.getBarcodes();
                  }
                }}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.getBarcodes}
                disabled={loading}
              >
                🔍
              </Button>
            </div>
          </Col>
        </Row>
        
        <Card border="light" className="shadow-sm">
          <Card.Header className="border-bottom d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Form.Check
                type="checkbox"
                id="select-all"
                label="Select All"
                checked={selectAll}
                onChange={this.handleSelectAll}
                className="me-3"
              />
              <span className="text-muted">
                {selectedBarcodes.size} of {barcodes.length} selected
              </span>
            </div>
            <div>
              <small className="text-muted">
                Total Records: {total}
              </small>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive className="table-centered table-nowrap mb-0">
              <thead className="thead-light">
                <tr>
                  <th className="border-0" style={{ width: "50px" }}>Select</th>
                  <th className="border-0">Barcode</th>
                  <th className="border-0">Product Name</th>
                  <th className="border-0" style={{ width: "200px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.map((barcode, key) => {
                  const barcodeId = barcode.id || barcode.barcode;
                  const isSelected = selectedBarcodes.has(barcodeId);
                  
                  return (
                    <tr key={key} className={isSelected ? "table-active" : ""}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => this.handleBarcodeSelect(barcodeId)}
                        />
                      </td>
                      <td>
                        <code className="text-primary fw-bold">
                          {barcode.barcode}
                        </code>
                      </td>
                      <td>{barcode.product_name}</td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-primary"
                            onClick={() => this.openEditModal(barcode)}
                            title="Edit Barcode"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="outline-success"
                            onClick={() => this.printSingleBarcode(barcode)}
                            disabled={printing}
                            title="Print Barcode"
                          >
                            🖨️
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            
            {barcodes.length === 0 && !loading && (
              <div className="text-center py-5">
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                <h5 className="text-muted">No barcodes found</h5>
                <p className="text-muted">Try adjusting your search criteria</p>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Edit Modal - UPDATED with onSuccess callback */}
        {showEditModal && (
          <EditBarcode 
            stock={editFormData} 
            toggle={() => this.closeEditModal()} 
            onSuccess={() => this.handleEditSuccess()}
          />
        )}
      </>
    );
  }
}

export default Barcode;