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
  Alert,
  Badge,
} from "@themesberg/react-bootstrap";

import SpinDiv from "../components/SpinDiv";

export class Barcode extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
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
    const { page, rows, search } = this.state;
    this.setState({ loading: true });
    
    try {
      const res = await getbarcodes({ page, rows, search });
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

  // FIXED: Generate barcodes using addBarcodes service
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

  // ADDED: Handle edit barcode
  handleEditBarcode = (barcode) => {
    this.setState({
      showEditModal: true,
      editingBarcode: barcode,
      editBarcodeValue: barcode.name
    });
  };

  // ADDED: Save edited barcode using updateBarcode service
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

  // FIXED: Handle print selected barcodes with actual printing functionality
  handlePrintSelected = () => {
    const { selectedBarcodes, barcodes } = this.state;
    if (selectedBarcodes.length === 0) {
      this.showToast("Please select barcodes to print", "warning");
      return;
    }
    
    const selectedBarcodeData = barcodes.filter(b => selectedBarcodes.includes(b.id));
    this.setState({ showPrintModal: true });
  };

  // ADDED: Actual print functionality
  handlePrintNow = () => {
    const { selectedBarcodes, barcodes } = this.state;
    const selectedBarcodeData = barcodes.filter(b => selectedBarcodes.includes(b.id));

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Generate HTML content for printing
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Print</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              font-size: 12px;
            }
            .barcode-item { 
              display: inline-block;
              margin: 10px;
              padding: 15px;
              border: 2px solid #000;
              text-align: center;
              width: 200px;
              page-break-inside: avoid;
            }
            .barcode-value { 
              font-family: 'Courier New', monospace;
              font-size: 14px;
              font-weight: bold;
              margin: 10px 0;
              letter-spacing: 2px;
            }
            .barcode-id {
              font-size: 10px;
              color: #666;
            }
            .barcode-bars {
              font-family: 'Courier New', monospace;
              font-size: 20px;
              letter-spacing: 1px;
              margin: 5px 0;
            }
            @media print {
              body { margin: 0; }
              .barcode-item { 
                break-inside: avoid;
                margin: 5px;
              }
            }
          </style>
        </head>
        <body>
          <h2 style="text-align: center; margin-bottom: 30px;">Barcode Print Sheet</h2>
          ${selectedBarcodeData.map(barcode => `
            <div class="barcode-item">
              <div class="barcode-id">ID: ${barcode.id}</div>
              <div class="barcode-bars">||||| |||| | ||| ||||</div>
              <div class="barcode-value">${barcode.name}</div>
              <div style="font-size: 8px; margin-top: 5px;">
                Used: ${barcode.order_items_count || 0} times
              </div>
            </div>
          `).join('')}
          <script>
            window.onload = function() {
              window.print();
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

  // ADDED: Print single barcode
  handlePrintSingle = (barcode) => {
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Barcode Print - ${barcode.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 50px;
              text-align: center;
            }
            .barcode-item { 
              display: inline-block;
              padding: 30px;
              border: 3px solid #000;
              margin: 20px;
            }
            .barcode-value { 
              font-family: 'Courier New', monospace;
              font-size: 18px;
              font-weight: bold;
              margin: 15px 0;
              letter-spacing: 3px;
            }
            .barcode-bars {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              letter-spacing: 2px;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="barcode-item">
            <div>ID: ${barcode.id}</div>
            <div class="barcode-bars">||||| |||| | ||| ||||</div>
            <div class="barcode-value">${barcode.name}</div>
            <div style="font-size: 12px; margin-top: 10px;">
              Used: ${barcode.order_items_count || 0} times
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
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

  render() {
    const {
      barcodes,
      total,
      search,
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
            <div className="d-flex justify-content-end">
              <FormControl
                type="text"
                placeholder="Search by barcode or product name..."
                className="me-2"
                style={{ maxWidth: "300px" }}
                value={search}
                onChange={(e) => this.handleSearchChange(e.target.value)}
                onKeyUp={(e) => {
                  if (e.key === "Enter") {
                    this.handleSearch();
                  }
                }}
              />
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={this.handleSearch}
                disabled={loading}
              >
                🔍
              </Button>
            </div>
          </Col>
        </Row>

        <Card border="light" className="shadow-sm">
          <Card.Header className="border-bottom d-flex justify-content-between align-items-center">
            <h6 className="m-0">Barcode Management</h6>
            <Badge variant="secondary">{total} Total</Badge>
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
                  <th>Used Count</th>
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
                      <td>{barcode.order_items_count}</td>
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
                    <td colSpan="6" className="text-center py-4">
                      <div className="text-muted">
                        {search ? `No barcodes found matching "${search}"` : "No barcodes available"}
                      </div>
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