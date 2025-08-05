import React, { Component } from "react";
import { Input, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { getbarcodes, updateBarcode, addBarcodes } from "../../services/brandService";
import { toast } from "react-toastify";
import { Pagination } from "antd";

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
  FormSelect,
  Alert,
  Badge,
} from "@themesberg/react-bootstrap";

import SpinDiv from "../components/SpinDiv";

export class Barcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      filterCount: "all", // New filter state
      page: 1,
      rows: 10,
      loading: false,
      barcodes: [],
      total: 0,
      selectedBarcodes: [],
      selectAll: false,

      showGenerateModal: false,
      numberOfBarcodes: 1,
      generatedBarcodes: [],
      showPrintModal: false,
      
      // Edit modal states
      showEditModal: false,
      editingBarcode: null,
      editBarcodeValue: "",
    };
  }

  componentDidMount() {
    this.getBarcodes();
  }

  getBarcodes = async () => {
    const { page, rows, search, filterCount } = this.state;
    this.setState({ loading: true });
    
    try {
      const params = { 
        page, 
        rows, 
        search: search.trim(),
        filter_count: filterCount
      };
      
      const res = await getbarcodes(params);
      this.setState({
        loading: false,
        barcodes: res.barcodes.data,
        total: res.barcodes.total,
        selectedBarcodes: [],
        selectAll: false,
      });
    } catch (error) {
      this.setState({ loading: false });
      this.showToast("Error loading barcodes", "error");
    }
  };

  onChange = (value, field) => {
    this.setState({ [field]: value });
  };

  showToast = (message, type = "success") => {
    toast[type](message);
  };

  // Generate barcode pattern - Fixed version
  generateBarcodePattern = (value) => {
    const chars = value.toString();
    let barsData = [];
    
    for (let i = 0; i < chars.length; i++) {
      const charCode = chars.charCodeAt(i);
      // Create different bar widths based on character codes
      const barWidth = (charCode % 4) + 1;
      const spaceWidth = ((charCode * 3) % 3) + 1;
      
      barsData.push({ type: 'bar', width: barWidth * 2 });
      barsData.push({ type: 'space', width: spaceWidth });
    }
    
    return barsData;
  };

  // Convert bars data to HTML string
  generateBarcodeHTML = (barsData) => {
    return barsData.map(item => {
      if (item.type === 'bar') {
        return `<div class="bar" style="width: ${item.width}px; height: 100%; background-color: #000; display: inline-block; margin: 0;"></div>`;
      } else {
        return `<div class="space" style="width: ${item.width}px; height: 100%; background-color: white; display: inline-block; margin: 0;"></div>`;
      }
    }).join('');
  };

  // Generate barcodes using addBarcodes service
  handleGenerateBarcodes = async () => {
    const { numberOfBarcodes } = this.state;
    
    this.setState({ loading: true });
    
    try {
      const response = await addBarcodes({ count: numberOfBarcodes });
      
      if (response && response.success) {
        this.showToast(`Successfully generated ${numberOfBarcodes} barcode${numberOfBarcodes > 1 ? 's' : ''}`, "success");
        // Refresh the barcode list first, then close modal
        await this.getBarcodes();
        this.setState({ 
          showGenerateModal: false,
          numberOfBarcodes: 1,
          loading: false
        });
      } else {
        throw new Error(response.message || "Failed to generate barcodes");
      }
    } catch (error) {
      this.setState({ 
        loading: false,
        showGenerateModal: false,
        numberOfBarcodes: 1
      });
      this.showToast(error.message || "Error generating barcodes", "error");
    }
  };

  // Handle edit barcode
  handleEditBarcode = (barcode) => {
    this.setState({
      showEditModal: true,
      editingBarcode: barcode,
      editBarcodeValue: barcode.name
    });
  };

  // Save edited barcode using updateBarcode service
  handleSaveEditedBarcode = async () => {
    const { editingBarcode, editBarcodeValue } = this.state;
    
    if (!editBarcodeValue.trim()) {
      this.showToast("Barcode value cannot be empty", "error");
      return;
    }

    this.setState({ loading: true });

    try {
      const response = await updateBarcode(editingBarcode.id, {
        name: editBarcodeValue.trim()
      });

      if (response && response.success) {
        this.showToast("Barcode updated successfully", "success");
        // Refresh the barcode list first, then close modal
        await this.getBarcodes();
        this.setState({
          showEditModal: false,
          editingBarcode: null,
          editBarcodeValue: "",
          loading: false
        });
      } else {
        throw new Error(response.message || "Failed to update barcode");
      }
    } catch (error) {
      this.setState({ 
        loading: false,
        showEditModal: false,
        editingBarcode: null,
        editBarcodeValue: ""
      });
      this.showToast(error.message || "Error updating barcode", "error");
    }
  };

  // Handle checkbox selection
  handleSelectBarcode = (barcodeId) => {
    const { selectedBarcodes } = this.state;
    const updatedSelection = selectedBarcodes.includes(barcodeId)
      ? selectedBarcodes.filter(id => id !== barcodeId)
      : [...selectedBarcodes, barcodeId];
    
    this.setState({
      selectedBarcodes: updatedSelection,
      selectAll: updatedSelection.length === this.state.barcodes.length
    });
  };

  // Handle select all
  handleSelectAll = () => {
    const { selectAll, barcodes } = this.state;
    if (selectAll) {
      this.setState({ selectedBarcodes: [], selectAll: false });
    } else {
      this.setState({ 
        selectedBarcodes: barcodes.map(b => b.id), 
        selectAll: true 
      });
    }
  };

  // Handle print selected barcodes
  handlePrintSelected = () => {
    const { selectedBarcodes, barcodes } = this.state;
    if (selectedBarcodes.length === 0) {
      this.showToast("Please select barcodes to print", "warning");
      return;
    }
    
    const selectedBarcodeData = barcodes.filter(b => selectedBarcodes.includes(b.id));
    this.setState({ showPrintModal: true });
  };

  // Print functionality with improved barcode rendering
  handlePrintNow = () => {
    const { selectedBarcodes, barcodes } = this.state;
    const selectedBarcodeData = barcodes.filter(b => selectedBarcodes.includes(b.id));

    // Generate barcode HTML for each barcode
    const barcodeItems = selectedBarcodeData.map((barcode) => {
      const barsData = this.generateBarcodePattern(barcode.name);
      const barcodeHTML = this.generateBarcodeHTML(barsData);
      
      return `
        <div class="barcode-item">
          <div class="barcode-lines">
            ${barcodeHTML}
          </div>
          <div class="barcode-value">${barcode.name}</div>
        </div>
      `;
    }).join('');

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for printing with improved CSS
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Print</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              font-size: 12px;
              background: white;
            }
            
            .barcode-item { 
              display: inline-block;
              margin: 15px;
              padding: 20px;
              border: 2px solid #000;
              text-align: center;
              width: 220px;
              page-break-inside: avoid;
              vertical-align: top;
              background: white;
            }
            
            .barcode-value { 
              font-family: 'Courier New', monospace;
              font-size: 14px;
              font-weight: bold;
              margin: 15px 0 5px 0;
              letter-spacing: 1px;
              color: #000;
            }
            
            .barcode-lines {
              display: flex;
              justify-content: center;
              align-items: flex-end;
              height: 60px;
              margin: 15px 0;
              background: white;
              padding: 5px;
              border: 1px solid #ccc;
            }
            
            .bar {
              background-color: #000 !important;
              height: 100% !important;
              display: inline-block !important;
              margin: 0 !important;
              vertical-align: bottom;
            }
            
            .space {
              background-color: white !important;
              height: 100% !important;
              display: inline-block !important;
              margin: 0 !important;
              vertical-align: bottom;
            }
            
            @media print {
              body { 
                margin: 10px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .barcode-item { 
                break-inside: avoid;
                margin: 10px;
                page-break-inside: avoid;
              }
              
              .bar {
                background-color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .space {
                background-color: white !important;
              }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px;">
            <h3>Barcode Print - ${new Date().toLocaleDateString()}</h3>
          </div>
          ${barcodeItems}
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
              
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    this.showToast(`Printing ${selectedBarcodes.length} barcodes...`, "success");
    this.setState({ 
      showPrintModal: false, 
      selectedBarcodes: [], 
      selectAll: false 
    });
  };

  // Print single barcode - Fixed version
  handlePrintSingle = (barcode) => {
    // Generate barcode pattern
    const barsData = this.generateBarcodePattern(barcode.name);
    const barcodeHTML = this.generateBarcodeHTML(barsData);
    
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Print - ${barcode.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 50px;
              text-align: center;
              background: white;
            }
            
            .barcode-item { 
              display: inline-block;
              padding: 40px;
              border: 3px solid #000;
              margin: 20px;
              background: white;
            }
            
            .barcode-value { 
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: bold;
              margin: 20px 0 10px 0;
              letter-spacing: 2px;
              color: #000;
            }
            
            .barcode-lines {
              display: flex;
              justify-content: center;
              align-items: flex-end;
              height: 80px;
              margin: 20px 0;
              background: white;
              padding: 10px;
              border: 1px solid #ccc;
            }
            
            .bar {
              background-color: #000 !important;
              height: 100% !important;
              display: inline-block !important;
              margin: 0 !important;
              vertical-align: bottom;
            }
            
            .space {
              background-color: white !important;
              height: 100% !important;
              display: inline-block !important;
              margin: 0 !important;
              vertical-align: bottom;
            }
            
            @media print {
              body { 
                margin: 30px;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .bar {
                background-color: #000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              
              .space {
                background-color: white !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="barcode-item">
            <div class="barcode-lines">
              ${barcodeHTML}
            </div>
            <div class="barcode-value">${barcode.name}</div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
              
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    this.showToast(`Printing barcode ${barcode.name}`, "success");
  };

  // Ant Design pagination handlers
  handlePageChange = (page, pageSize) => {
    this.setState({ 
      page: page,
      rows: pageSize 
    }, () => {
      this.getBarcodes();
    });
  };

  handlePageSizeChange = (current, size) => {
    this.setState({ 
      page: 1,
      rows: size 
    }, () => {
      this.getBarcodes();
    });
  };

  // Handle search functionality
  handleSearch = () => {
    this.setState({ page: 1 }, () => {
      this.getBarcodes();
    });
  };

  // Handle search input with debounce
  handleSearchChange = (value) => {
    this.setState({ search: value });
    
    // Optional: Add debounce for real-time search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    this.searchTimeout = setTimeout(() => {
      this.setState({ page: 1 }, () => {
        this.getBarcodes();
      });
    }, 500); // 500ms delay
  };

  // Handle filter change
  handleFilterChange = (value) => {
    this.setState({ 
      filterCount: value, 
      page: 1 
    }, () => {
      this.getBarcodes();
    });
  };

  // Clear all filters and search
  handleClearFilters = () => {
    this.setState({
      search: "",
      filterCount: "all",
      page: 1
    }, () => {
      this.getBarcodes();
    });
  };

  render() {
    const {
      barcodes,
      total,
      search,
      filterCount,
      loading,
      selectedBarcodes,
      selectAll,
      showGenerateModal,
      numberOfBarcodes,
      showPrintModal,
      showEditModal,
      editingBarcode,
      editBarcodeValue,
      page,
      rows
    } = this.state;

    // Calculate filter counts for display
    const usedCount = barcodes.filter(b => b.order_items_count > 0).length;
    const unusedCount = barcodes.filter(b => b.order_items_count === 0).length;

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
            </div>
          </Col>
        </Row>

        {/* Action Buttons Row */}
        <Row className="mb-4">
          <Col lg="6">
            <ButtonGroup>
              <Button
                variant="primary"
                size="sm"
                onClick={() => this.setState({ showGenerateModal: true })}
              >
                + Generate Barcodes
              </Button>
              <Button
                variant="success"
                size="sm"
                onClick={this.handlePrintSelected}
                disabled={selectedBarcodes.length === 0}
              >
                🖨️ Print Selected ({selectedBarcodes.length})
              </Button>
            </ButtonGroup>
          </Col>
          <Col lg="6">
            <div className="d-flex justify-content-end gap-2">
              <FormControl
                type="text"
                placeholder="Search by barcode or product name..."
                style={{ maxWidth: "250px" }}
                value={search}
                onChange={(e) => this.handleSearchChange(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    this.handleSearch();
                  }
                }}
              />
              <FormSelect
                style={{ maxWidth: "150px" }}
                value={filterCount}
                onChange={(e) => this.handleFilterChange(e.target.value)}
              >
                <option value="all">All Barcodes</option>
                <option value="greater_than_zero">Used ({usedCount})</option>
                <option value="equals_zero">Unused ({unusedCount})</option>
              </FormSelect>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.handleSearch}
                disabled={loading}
              >
                🔍
              </Button>
              {(search || filterCount !== "all") && (
                <Button
                  variant="outline-warning"
                  size="sm"
                  onClick={this.handleClearFilters}
                  title="Clear all filters"
                >
                  ✖️
                </Button>
              )}
            </div>
          </Col>
        </Row>

        {/* Filter Status Alert */}
        {(search || filterCount !== "all") && (
          <Row className="mb-3">
            <Col lg="12">
              <Alert variant="info" className="py-2">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Filters Applied:</strong>
                    {search && <Badge variant="secondary" className="ms-2">Search: "{search}"</Badge>}
                    {filterCount !== "all" && (
                      <Badge variant="secondary" className="ms-2">
                        {filterCount === "greater_than_zero" ? "Used Only" : "Unused Only"}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={this.handleClearFilters}
                  >
                    Clear All
                  </Button>
                </div>
              </Alert>
            </Col>
          </Row>
        )}

        <Card border="light" className="shadow-sm">
          <Card.Header className="border-bottom d-flex justify-content-between align-items-center">
            <h6 className="m-0">Barcode Management</h6>
            <div className="d-flex gap-2">
              <Badge variant="secondary">{total} Total</Badge>
              <Badge variant="success">{usedCount} Used</Badge>
              <Badge variant="warning">{unusedCount} Unused</Badge>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <Table responsive className="table-centered table-nowrap mb-0">
              <thead className="thead-light">
                <tr>
                  <th>
                    <Form.Check
                      type="checkbox"
                      checked={selectAll}
                      onChange={this.handleSelectAll}
                    />
                  </th>
                  <th>ID</th>
                  <th>Barcode</th>
                  <th>
                    Used Count
                  
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {barcodes.length > 0 ? (
                  barcodes.map((barcode) => (
                    <tr key={barcode.id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedBarcodes.includes(barcode.id)}
                          onChange={() => this.handleSelectBarcode(barcode.id)}
                        />
                      </td>
                      <td>{barcode.id}</td>
                      <td>
                        <code>{barcode.name}</code>
                      </td>
                      <td>
                      {barcode.order_items_count}
                      </td>
                      <td>
                        <ButtonGroup size="sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => this.handleEditBarcode(barcode)}
                            title="Edit barcode"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => this.handlePrintSingle(barcode)}
                            title="Print single barcode"
                          >
                            🖨️
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <div className="text-muted">
                        {search || filterCount !== "all" 
                          ? `No barcodes found matching current filters` 
                          : "No barcodes available"}
                      </div>
                      {(search || filterCount !== "all") && (
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="mt-2"
                          onClick={this.handleClearFilters}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            
            {/* Ant Design Pagination */}
            <div className="d-flex justify-content-center p-3">
              <Pagination
                current={page}
                total={total}
                pageSize={rows}
                showSizeChanger={true}
                pageSizeOptions={['10', '20', '50', '100']}
                showQuickJumper={true}
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
                }
                onChange={this.handlePageChange}
                onShowSizeChange={this.handlePageSizeChange}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Generate Barcodes Modal */}
        <Modal isOpen={showGenerateModal} toggle={() => this.setState({ showGenerateModal: false })}>
          <ModalHeader toggle={() => this.setState({ showGenerateModal: false })}>
            Generate New Barcodes
          </ModalHeader>
          <ModalBody>
            <FormGroup>
              <FormLabel>Number of Barcodes to Generate</FormLabel>
              <FormControl
                type="number"
                min="1"
                max="100"
                value={numberOfBarcodes}
                onChange={(e) => this.onChange(parseInt(e.target.value) || 1, "numberOfBarcodes")}
              />
            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="secondary" 
              onClick={() => this.setState({ showGenerateModal: false })}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={this.handleGenerateBarcodes}
              disabled={loading}
            >
              Generate {numberOfBarcodes} Barcode{numberOfBarcodes !== 1 ? 's' : ''}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Edit Barcode Modal */}
        <Modal isOpen={showEditModal} toggle={() => this.setState({ showEditModal: false })}>
          <ModalHeader toggle={() => this.setState({ showEditModal: false })}>
            Edit Barcode
          </ModalHeader>
          <ModalBody>
            {editingBarcode && (
              <>
                <FormGroup>
                  <FormLabel>Barcode ID</FormLabel>
                  <FormControl
                    type="text"
                    value={editingBarcode.id}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Barcode Value</FormLabel>
                  <FormControl
                    type="text"
                    value={editBarcodeValue}
                    onChange={(e) => this.setState({ editBarcodeValue: e.target.value })}
                    placeholder="Enter barcode value"
                  />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Used Count</FormLabel>
                  <FormControl
                    type="text"
                    value={editingBarcode.order_items_count || 0}
                    disabled
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </FormGroup>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="secondary" 
              onClick={() => this.setState({ showEditModal: false })}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={this.handleSaveEditedBarcode}
              disabled={loading || !editBarcodeValue.trim()}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </Modal>

        {/* Print Modal */}
        <Modal isOpen={showPrintModal} toggle={() => this.setState({ showPrintModal: false })}>
          <ModalHeader toggle={() => this.setState({ showPrintModal: false })}>
            Print Barcodes
          </ModalHeader>
          <ModalBody>
            <p>Ready to print {selectedBarcodes.length} selected barcode(s).</p>
            <div className="barcode-preview" style={{ maxHeight: "300px", overflowY: "auto" }}>
              {barcodes
                .filter(b => selectedBarcodes.includes(b.id))
                .map(barcode => (
                  <div key={barcode.id} className="p-2 border mb-2">
                    <strong>ID: {barcode.id}</strong><br />
                    <code style={{ fontSize: "14px" }}>{barcode.name}</code><br />
                    <small>Used Count: {barcode.order_items_count || 0}</small>
                  </div>
                ))}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="secondary" 
              onClick={() => this.setState({ showPrintModal: false })}
            >
              Cancel
            </Button>
            <Button 
              variant="primary"
              onClick={this.handlePrintNow}
            >
              🖨️ Print Now
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default Barcode;