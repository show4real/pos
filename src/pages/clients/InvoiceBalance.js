import React from "react";
import { Card } from "@themesberg/react-bootstrap";
import moment from "moment";

export class InvoiceBalance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      company: props.company,
      user: props.user,
      loading: false,
      saving: false,
    };
  }

  formatCurrency2(x) {
    if (x) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `${parts.join(".")}`;
    }
    return "0";
  }

  formatCurrency(x) {
    return x.toLocaleString(undefined, { minimumFractionDigits: 2 });
  }

  render() {
    const {
      invoice,
      company,
      total_balance,
      prev_balance,
      last_paid,
      total_amount,
      total_paid,
    } = this.props;

    const isA4 = this.props.format === 'A4';
    
    const thermalStyles = {
      receipt: {
        fontFamily: "'Courier New', 'Monaco', 'Lucida Console', monospace",
        fontSize: isA4 ? "14px" : "12px",
        lineHeight: isA4 ? "1.4" : "1.2",
        color: "#000",
        backgroundColor: "#fff",
        maxWidth: isA4 ? "210mm" : "300px",
        minHeight: isA4 ? "297mm" : "auto",
        margin: "0 auto",
        padding: isA4 ? "20mm" : "10px",
        border: isA4 ? "none" : "1px solid #ddd",
        boxSizing: "border-box",
      },
      header: {
        textAlign: "center",
        borderBottom: "2px solid #000",
        paddingBottom: isA4 ? "15px" : "8px",
        marginBottom: isA4 ? "25px" : "12px",
      },
      companyName: {
        fontSize: isA4 ? "24px" : "16px",
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: isA4 ? "2px" : "1px",
        marginBottom: isA4 ? "8px" : "4px",
      },
      contactInfo: {
        fontSize: isA4 ? "12px" : "10px",
        marginBottom: isA4 ? "4px" : "2px",
      },
      divider: {
        textAlign: "center",
        margin: isA4 ? "15px 0" : "8px 0",
        fontSize: isA4 ? "12px" : "10px",
      },
      receiptInfo: {
        marginBottom: isA4 ? "25px" : "12px",
        fontSize: isA4 ? "12px" : "10px",
        display: isA4 ? "flex" : "block",
        justifyContent: isA4 ? "space-between" : "initial",
      },
      customerSection: {
        borderTop: "1px dashed #000",
        borderBottom: "1px dashed #000",
        padding: isA4 ? "15px 0" : "8px 0",
        marginBottom: isA4 ? "25px" : "12px",
        display: isA4 ? "grid" : "block",
        gridTemplateColumns: isA4 ? "1fr 1fr" : "1fr",
        gap: isA4 ? "30px" : "0",
      },
      sectionTitle: {
        fontSize: isA4 ? "14px" : "11px",
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: isA4 ? "8px" : "4px",
        borderBottom: isA4 ? "1px solid #ccc" : "none",
        paddingBottom: isA4 ? "4px" : "0",
      },
      customerInfo: {
        fontSize: isA4 ? "12px" : "10px",
        lineHeight: isA4 ? "1.5" : "1.3",
      },
      balanceSection: {
        marginBottom: isA4 ? "25px" : "12px",
      },
      balanceLine: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: isA4 ? "13px" : "11px",
        marginBottom: isA4 ? "6px" : "3px",
        fontFamily: "'Courier New', monospace",
        padding: isA4 ? "4px 0" : "0",
      },
      totalLine: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: isA4 ? "16px" : "12px",
        fontWeight: "bold",
        borderTop: "2px solid #000",
        paddingTop: isA4 ? "10px" : "4px",
        marginTop: isA4 ? "15px" : "6px",
        backgroundColor: isA4 ? "#f8f8f8" : "transparent",
        padding: isA4 ? "10px" : "4px 0 0 0",
      },
      footer: {
        borderTop: "2px solid #000",
        paddingTop: isA4 ? "20px" : "8px",
        textAlign: "center",
        fontSize: isA4 ? "11px" : "9px",
        lineHeight: isA4 ? "1.6" : "1.4",
        marginTop: isA4 ? "auto" : "0",
        minHeight: isA4 ? "80px" : "auto",
      },
      dots: {
        flexGrow: 1,
        borderBottom: "1px dotted #666",
        margin: "0 4px",
        height: "1px",
      }
    };

    return (
      <Card style={{ padding: "0", border: "none", backgroundColor: "transparent" }}>
        <div style={thermalStyles.receipt}>
          {/* Header */}
          <div style={thermalStyles.header}>
            <div style={thermalStyles.companyName}>
              {company?.name || "COMPANY NAME"}
            </div>
            <div style={thermalStyles.contactInfo}>
              Tel: {company?.phone_one}{company?.phone_two ? `, ${company.phone_two}` : ""}
            </div>
            {company?.website && (
              <div style={thermalStyles.contactInfo}>
                Web: {company.website}
              </div>
            )}
            {company?.address && (
              <div style={thermalStyles.contactInfo}>
                {company.address}
              </div>
            )}
          </div>

          {/* Receipt Type and Date */}
          <div style={thermalStyles.receiptInfo}>
            <div style={{
              textAlign: isA4 ? "left" : "center", 
              fontWeight: "bold", 
              fontSize: isA4 ? "16px" : "11px", 
              marginBottom: isA4 ? "0" : "6px",
              textTransform: "uppercase"
            }}>
              Customer Balance Statement
            </div>
            {isA4 ? (
              <div style={{textAlign: "right"}}>
                <div>Date: {moment(invoice?.created_at).format("DD/MM/YYYY")}</div>
                <div>Time: {moment(invoice?.created_at).format("HH:mm")}</div>
              </div>
            ) : (
              <div>Date: {moment(invoice?.created_at).format("DD/MM/YYYY HH:mm")}</div>
            )}
          </div>

          {/* Customer Information */}
          <div style={thermalStyles.customerSection}>
            <div>
              <div style={thermalStyles.sectionTitle}>Bill To:</div>
              <div style={thermalStyles.customerInfo}>
                <div style={{fontWeight: "bold", fontSize: isA4 ? "14px" : "10px"}}>
                  {invoice?.client_name || "Customer Name"}
                </div>
                {invoice?.client_phone && <div>Phone: {invoice.client_phone}</div>}
                {invoice?.client_address && <div>Address: {invoice.client_address}</div>}
                {invoice?.client_email && <div>Email: {invoice.client_email}</div>}
              </div>
            </div>
            
            {isA4 && (
              <div>
                <div style={thermalStyles.sectionTitle}>Company Info:</div>
                <div style={thermalStyles.customerInfo}>
                  <div style={{fontWeight: "bold"}}>{company?.name || "Company Name"}</div>
                  <div>{company?.address}</div>
                  <div>Tel: {company?.phone_one}{company?.phone_two ? `, ${company.phone_two}` : ""}</div>
                  {company?.website && <div>Web: {company.website}</div>}
                </div>
              </div>
            )}
          </div>

          {/* Balance Information */}
          <div style={thermalStyles.balanceSection}>
            <div style={{...thermalStyles.sectionTitle, marginBottom: isA4 ? "20px" : "8px"}}>
              Account Summary:
            </div>
            
            <div style={{
              backgroundColor: isA4 ? "#f9f9f9" : "transparent",
              padding: isA4 ? "15px" : "0",
              border: isA4 ? "1px solid #ddd" : "none"
            }}>
              <div style={thermalStyles.balanceLine}>
                <span>Previous Balance:</span>
                <span style={thermalStyles.dots}></span>
                <span style={{fontWeight: isA4 ? "bold" : "normal"}}>
                  {invoice?.currency || "₦"}{this.formatCurrency2(total_amount - (total_paid - last_paid))}
                </span>
              </div>
              
              <div style={thermalStyles.balanceLine}>
                <span>Payment Received:</span>
                <span style={thermalStyles.dots}></span>
                <span style={{fontWeight: isA4 ? "bold" : "normal"}}>
                  {invoice?.currency || "₦"}{this.formatCurrency2(last_paid)}
                </span>
              </div>
              
              <div style={thermalStyles.totalLine}>
                <span>CURRENT BALANCE:</span>
                <span style={{...thermalStyles.dots, borderBottom: "2px solid #000"}}></span>
                <span>{invoice?.currency || "₦"}{this.formatCurrency2(total_amount - total_paid)}</span>
              </div>
            </div>

            {/* {isA4 && (
              <div style={{
                marginTop: "30px",
                padding: "15px",
                border: "1px solid #ccc",
                backgroundColor: "#f0f8ff"
              }}>
                <div style={{fontSize: "12px", color: "#666", lineHeight: "1.6"}}>
                  <div style={{fontWeight: "bold", marginBottom: "8px"}}>Payment Information:</div>
                  <div>• Payment due within 30 days of statement date</div>
                  <div>• Please reference your account number when making payments</div>
                  <div>• For inquiries, contact us using the information above</div>
                </div>
              </div>
            )} */}
          </div>

          {/* Footer */}
          <div style={thermalStyles.footer}>
            {company?.invoice_footer_one && (
              <div style={{marginBottom: isA4 ? "8px" : "4px", fontWeight: isA4 ? "bold" : "normal"}}>
                {company.invoice_footer_one}
              </div>
            )}
            {company?.invoice_footer_two && (
              <div style={{marginBottom: isA4 ? "8px" : "4px", fontWeight: isA4 ? "bold" : "normal"}}>
                {company.invoice_footer_two}
              </div>
            )}
            <div style={{
              marginTop: isA4 ? "20px" : "8px", 
              fontSize: isA4 ? "10px" : "8px", 
              color: "#666",
              borderTop: isA4 ? "1px solid #eee" : "none",
              paddingTop: isA4 ? "15px" : "0"
            }}>
              {isA4 ? "Thank you for choosing our services!" : "Thank you for your business!"}
              {isA4 && (
                <div style={{marginTop: "10px", fontSize: "9px"}}>
                  This is a computer generated statement and does not require signature.
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

export default InvoiceBalance;