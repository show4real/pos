import React, { useState, useEffect, useRef, useCallback } from "react";
import { Pagination } from "antd";
import { Col, Row, Card, Table, Button, Spinner, Alert } from "@themesberg/react-bootstrap";
import moment from "moment";
import { getCompany } from "../../services/companyService";
import { useParams } from "react-router-dom";
import InvoiceBalance from "./InvoiceBalance";
import ReactToPrint from "react-to-print";
import settings from "../../services/settings";

const ClientPayments = () => {
  // State management
  const [data, setData] = useState({
    client_invoices_payments: { data: [], total: 0, current_page: 1 },
    total_amount: 0,
    total_paid: 0,
    last_paid: 0,
    // Remove inconsistent fields to avoid confusion
  });
  const [pagination, setPagination] = useState({ rows: 20000, page: 1 });
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState({});
  const [error, setError] = useState(null);
  
  const printRef = useRef();
  const { id } = useParams();
  
  // Get user from localStorage with error handling
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  }, []);

  // Utility function for currency formatting
  const formatCurrency = useCallback((amount) => {
    if (amount == null || amount === 0) return "0";
    const parts = Math.abs(amount).toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }, []);

  // Calculate totals from invoice data
  const calculateTotals = useCallback((invoicesData) => {
    if (!invoicesData || !Array.isArray(invoicesData)) {
      return {
        totalPurchases: 0,
        totalPaid: 0,
        currentBalance: 0,
        previousBalance: 0,
        lastPaymentAmount: 0
      };
    }

    let totalPurchases = 0;
    let allPayments = [];

    // First pass: collect all invoice amounts and payments
    invoicesData.forEach(invoice => {
      // Sum up all invoice amounts (total purchases)
      totalPurchases += parseFloat(invoice.amount || 0);
      
      // Collect all individual payments with dates
      if (invoice.payments && Array.isArray(invoice.payments)) {
        invoice.payments.forEach(payment => {
          allPayments.push({
            amount: parseFloat(payment.amount_paid || 0),
            date: new Date(payment.created_at),
            invoice_num: payment.invoice_num
          });
        });
      }
    });

    // Sort payments by date (newest first)
    allPayments.sort((a, b) => b.date - a.date);

    // Calculate total paid (sum of all payments)
    const totalPaid = allPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Get the most recent payment
    const lastPaymentAmount = allPayments.length > 0 ? allPayments[0].amount : 0;

    // Calculate current balance
    const currentBalance = totalPurchases - totalPaid;

    // Calculate previous balance (excluding the most recent payment)
    const totalPaidExcludingLast = totalPaid - lastPaymentAmount;
    const previousBalance = totalPurchases - totalPaidExcludingLast;

    return {
      totalPurchases,
      totalPaid,
      currentBalance,
      previousBalance,
      lastPaymentAmount
    };
  }, []);

  // Fetch company details
  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCompany();
      setCompany(res.company);
    } catch (error) {
      console.error("Error fetching company details:", error);
      setError("Failed to load company details");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch payments data
  const fetchPayments = useCallback(async () => {
    if (!user?.token || !id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${settings.API_URL}clients/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          client_id: id,
          rows: pagination.rows,
          page: pagination.page,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Calculate totals from the received data
      const totals = calculateTotals(result.client_invoices_payments?.data);
      
      // Update state with calculated totals (prioritize calculated values)
      setData({
        ...result,
        total_amount: totals.totalPurchases,
        total_paid: totals.totalPaid,
        last_paid: totals.lastPaymentAmount,
        current_balance: totals.currentBalance,
        previous_balance: totals.previousBalance,
      });
    } catch (error) {
      console.error("Error fetching client payments:", error);
      setError("Failed to load payment data");
    } finally {
      setLoading(false);
    }
  }, [user?.token, id, pagination, calculateTotals]);

  // Handle pagination changes
  const handlePageChange = useCallback((page, pageSize = pagination.rows) => {
    setPagination({ page, rows: pageSize });
  }, [pagination.rows]);

  // Effects
  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Computed values with proper fallbacks
  const hasPayments = data.client_invoices_payments?.data?.length > 0;
  const firstInvoice = hasPayments ? data.client_invoices_payments.data[0] : null;
  
  // Use calculated values directly
  const totalPurchases = parseFloat(data.total_amount || 0);
  const totalPaid = parseFloat(data.total_paid || 0);
  const lastPaid = parseFloat(data.last_paid || 0);
  const currentBalance = parseFloat(data.current_balance || 0);
  const previousBalance = parseFloat(data.previous_balance || 0);

  // Loading state
  if (loading && !hasPayments) {
    return (
      <div className="container-fluid mt-5">
        <Card>
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 mb-0">Loading payment data...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Hidden Invoice for Printing */}
      <div style={{ display: "none" }}>
        {hasPayments && (
          <InvoiceBalance
            invoice={firstInvoice}
            company={company}
            total_balance={currentBalance}
            prev_balance={previousBalance}
            last_paid={lastPaid}
            total_amount={totalPurchases}
            total_paid={totalPaid}
            user={user}
            ref={printRef}
            toggle={() => setData(prev => ({ ...prev }))}
          />
        )}
      </div>

      <div className="container-fluid mt-5">
        <Card className="shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Card.Title className="h4 mb-0 text-primary">
                Customer Payment Summary
              </Card.Title>
              {hasPayments && (
                <ReactToPrint
                  trigger={() => (
                    <Button variant="outline-success" size="sm">
                      <i className="fas fa-print me-2"></i>
                      Print Balance
                    </Button>
                  )}
                  content={() => printRef.current}
                />
              )}
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            {hasPayments ? (
              <div className="mb-4">
                <Row className="g-3">
                  <Col md={6}>
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted mb-2">Customer Information</h6>
                      <p className="mb-1">
                        <strong>Name:</strong> {firstInvoice.client_name}
                      </p>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-muted mb-2">Financial Summary</h6>
                      <p className="mb-1">
                        <strong>Total Purchases:</strong> 
                        <span className="text-info ms-2">NGN {formatCurrency(totalPurchases)}</span>
                      </p>
                      <p className="mb-1">
                        <strong>Total Paid:</strong> 
                        <span className="text-success ms-2">NGN {formatCurrency(totalPaid)}</span>
                      </p>
                      <p className="mb-1">
                        <strong>Previous Balance:</strong> 
                        <span className="text-warning ms-2">NGN {formatCurrency(previousBalance)}</span>
                      </p>
                      <p className="mb-1">
                        <strong>Last Payment:</strong> 
                        <span className="text-primary ms-2">NGN {formatCurrency(lastPaid)}</span>
                      </p>
                      <p className="mb-0">
                        <strong>Current Balance:</strong> 
                        <span className={`ms-2 fw-bold ${currentBalance > 0 ? 'text-danger' : currentBalance < 0 ? 'text-success' : 'text-muted'}`}>
                          NGN {currentBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(currentBalance))}
                        </span>
                      </p>
                    </div>
                  </Col>
                </Row>
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-receipt fa-3x text-muted mb-3"></i>
                <p className="text-muted">No payment records found for this customer.</p>
              </div>
            )}
          </Card.Body>

          {/* Pagination */}
          {/* {data.client_invoices_payments?.total > 0 && (
            <Card.Footer className="bg-white">
              <Row>
                <Col className="d-flex justify-content-center">
                  <Pagination
                    showSizeChanger
                    current={pagination.page}
                    total={data.client_invoices_payments.total}
                    showTotal={(total) => `Total ${total} Invoices`}
                    onChange={handlePageChange}
                    pageSize={pagination.rows}
                    showQuickJumper
                  />
                </Col>
              </Row>
            </Card.Footer>
          )} */}

          {/* Invoice Data */}
          {data.client_invoices_payments?.data?.map((invoice, index) => {
            const invoiceBalance = parseFloat(invoice.amount || 0) - parseFloat(invoice.amount_paid || 0);
            
            return (
              <Card.Body key={index} className={index > 0 ? "border-top" : ""}>
                <div className="invoice-header bg-light rounded p-3 mb-3">
                  <Row className="g-2">
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Invoice No</small>
                      <strong className="text-primary">{invoice.invoice_no}</strong>
                    </Col>
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Amount</small>
                      <strong>{invoice.currency}{formatCurrency(invoice.amount)}</strong>
                    </Col>
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Total Paid</small>
                      <strong className="text-success">
                        {invoice.currency}{formatCurrency(invoice.amount_paid)}
                      </strong>
                    </Col>
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Balance</small>
                      <strong className={invoiceBalance > 0 ? "text-danger" : invoiceBalance < 0 ? "text-success" : "text-muted"}>
                        {invoice.currency}{invoiceBalance < 0 ? '-' : ''}{formatCurrency(invoiceBalance)}
                      </strong>
                    </Col>
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Date</small>
                      <strong>{moment(invoice.created_at).format("MMM DD, YYYY")}</strong>
                    </Col>
                    <Col sm={6} md={4} lg={2}>
                      <small className="text-muted d-block">Cashier</small>
                      <strong>{invoice.cashier_name}</strong>
                    </Col>
                  </Row>
                </div>

                <div className="table-responsive">
                  <Table className="table-sm table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '60px' }}>No</th>
                        <th>Invoice No</th>
                        <th style={{ width: '150px' }}>Amount Paid</th>
                        <th style={{ width: '150px' }}>Transaction Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.payments?.map((payment, idx) => (
                        <tr key={idx}>
                          <td className="text-muted">{idx + 1}</td>
                          <td>
                            <span className="text-primary">
                              {payment.invoice_num}
                            </span>
                          </td>
                          <td>
                            <strong className="text-success">
                              {invoice.currency}{formatCurrency(payment.amount_paid)}
                            </strong>
                          </td>
                          <td className="text-muted">
                            {moment(payment.created_at).format("MMM DD, YYYY")}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td colSpan="4" className="text-center text-muted">No payments recorded</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            );
          })}
        </Card>
      </div>
    </>
  );
};

export default ClientPayments;