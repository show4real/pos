import React from "react";
import { Card, Table } from "@themesberg/react-bootstrap";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faGlobe } from "@fortawesome/free-solid-svg-icons";
import { toWords } from "../../services/numberWordService";

export class Invoice extends React.Component {
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

  getWords(amount) {
    return toWords(amount);
  }

  totalCost = () => {
    const { items } = this.props;
    return items.reduce((total, item) => total + item.rate * item.quantity, 0);
  };

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

  combineItems = (items) => {
    return items.reduce((acc, item) => {
      const existingItem = acc.find(
        (i) =>
          i.order.product_name === item.order.product_name &&
          i.selling_price === item.selling_price
      );

      if (existingItem) {
        existingItem.qty_sold += item.qty_sold;
      } else {
        acc.push({ ...item });
      }

      return acc;
    }, []);
  };

  render() {
    const { 
      invoice, 
      company, 
      items, 
      pos_items, 
      total_balance, 
      prev_balance, 
      delivery_fee,
      discount,
      discount_percentage 
    } = this.props;
    
    const combinedItems = this.combineItems(pos_items);

    const thermalStyles = {
      container: {
        fontFamily: "'Courier New', monospace",
        width: "80mm", // Standard thermal printer width
        maxWidth: "302px", // 80mm in pixels at 96dpi
        margin: "0 auto",
        padding: "5px",
        backgroundColor: "white",
        color: "black",
        fontSize: "12px",
        lineHeight: "1.2",
        boxSizing: "border-box",
      },
      header: {
        textAlign: "center",
        marginBottom: "8px",
        borderBottom: "1px dashed #000",
        paddingBottom: "5px",
      },
      companyName: {
        fontSize: "16px",
        fontWeight: "bold",
        margin: "0 0 3px 0",
        textTransform: "uppercase",
      },
      contactInfo: {
        fontSize: "10px",
        margin: "1px 0",
      },
      invoiceInfo: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: "10px",
        marginBottom: "8px",
        paddingBottom: "5px",
        borderBottom: "1px dashed #000",
      },
      invoiceLeft: {
        textAlign: "left",
        flex: 1,
      },
      invoiceRight: {
        textAlign: "right",
        flex: 1,
      },
      table: {
        width: "100%",
        marginBottom: "8px",
        fontSize: "10px",
        borderCollapse: "collapse",
      },
      tableHeader: {
        borderBottom: "1px solid #000",
        borderTop: "1px solid #000",
        fontWeight: "bold",
        padding: "2px 1px",
        textAlign: "left",
      },
      tableCell: {
        padding: "2px 1px",
        borderBottom: "1px dotted #ccc",
        verticalAlign: "top",
      },
      totalsSection: {
        fontSize: "11px",
        textAlign: "right",
        marginBottom: "8px",
        paddingTop: "5px",
        borderTop: "1px dashed #000",
      },
      totalLine: {
        margin: "2px 0",
        display: "flex",
        justifyContent: "space-between",
      },
      totalLabel: {
        fontWeight: "normal",
      },
      totalAmount: {
        fontWeight: "bold",
        minWidth: "60px",
        textAlign: "right",
      },
      grandTotal: {
        fontSize: "12px",
        fontWeight: "bold",
        borderTop: "1px solid #000",
        paddingTop: "3px",
        marginTop: "3px",
      },
      footer: {
        fontSize: "9px",
        textAlign: "center",
        marginTop: "8px",
        paddingTop: "5px",
        borderTop: "1px dashed #000",
      },
      divider: {
        textAlign: "center",
        margin: "5px 0",
        fontSize: "10px",
      },
      discountLine: {
        color: "#d63384", // Bootstrap danger color for discount
      },
    };

    return (
      <div style={thermalStyles.container}>
        {Object.keys(invoice).length !== 0 && (
          <>
            {/* Header */}
            <header style={thermalStyles.header}>
              <h1 style={thermalStyles.companyName}>
                {company?.name || ""}
              </h1>
              <div style={thermalStyles.contactInfo}>
                <FontAwesomeIcon icon={faPhone} size="xs" /> {company.phone_one}
                {company.phone_two && `, ${company.phone_two}`}
              </div>
              {company.website && (
                <div style={thermalStyles.contactInfo}>
                  <FontAwesomeIcon icon={faGlobe} size="xs" /> {company.website}
                </div>
              )}
              {company.address && (
                <div style={thermalStyles.contactInfo}>{company.address}</div>
              )}
            </header>

            {/* Invoice Info */}
            <div style={thermalStyles.invoiceInfo}>
              <div style={thermalStyles.invoiceLeft}>
                <div>Date: {moment(invoice.created_at).format("DD/MM/YY HH:mm")}</div>
                <div>Invoice #: {invoice.invoice_no}</div>
              </div>
              <div style={thermalStyles.invoiceRight}>
                <div><strong>CUSTOMER</strong></div>
                <div>{invoice.client.name}</div>
                {invoice.client.phone && <div>{invoice.client.phone}</div>}
              </div>
            </div>

            {/* Items Table */}
            <table style={thermalStyles.table}>
              <thead>
                <tr>
                  <th style={{ ...thermalStyles.tableHeader, width: "45%" }}>ITEM</th>
                  <th style={{ ...thermalStyles.tableHeader, width: "15%", textAlign: "center" }}>QTY</th>
                  <th style={{ ...thermalStyles.tableHeader, width: "20%", textAlign: "right" }}>PRICE</th>
                  <th style={{ ...thermalStyles.tableHeader, width: "20%", textAlign: "right" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {combinedItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ ...thermalStyles.tableCell, fontSize: "9px" }}>
                      {item.order.product_name.toUpperCase()}
                    </td>
                    <td style={{ ...thermalStyles.tableCell, textAlign: "center" }}>
                      {item.qty_sold}
                    </td>
                    <td style={{ ...thermalStyles.tableCell, textAlign: "right" }}>
                      {this.formatCurrency(item.selling_price)}
                    </td>
                    <td style={{ ...thermalStyles.tableCell, textAlign: "right", fontWeight: "bold" }}>
                      {this.formatCurrency(item.selling_price * item.qty_sold)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Section */}
            <div style={thermalStyles.totalsSection}>
              <div style={thermalStyles.totalLine}>
                <span style={thermalStyles.totalLabel}>Subtotal:</span>
                <span style={thermalStyles.totalAmount}>
                  {invoice.currency}{this.formatCurrency2(invoice.amount)}
                </span>
              </div>

              {/* Delivery Fee */}
              {delivery_fee > 0 && (
                <div style={thermalStyles.totalLine}>
                  <span style={thermalStyles.totalLabel}>Delivery Fee:</span>
                  <span style={thermalStyles.totalAmount}>
                    {invoice.currency}{this.formatCurrency2(delivery_fee)}
                  </span>
                </div>
              )}

              {/* Discount */}
              {(discount > 0 || discount_percentage > 0) && (
                <div style={{ ...thermalStyles.totalLine, ...thermalStyles.discountLine }}>
                  <span style={thermalStyles.totalLabel}>
                    Discount {discount_percentage > 0 ? `(${discount_percentage}%)` : ''}:
                  </span>
                  <span style={thermalStyles.totalAmount}>
                    -{invoice.currency}{this.formatCurrency2(discount || 0)}
                  </span>
                </div>
              )}
              
              <div style={thermalStyles.totalLine}>
                <span style={thermalStyles.totalLabel}>Paid:</span>
                <span style={thermalStyles.totalAmount}>
                  {invoice.currency}{this.formatCurrency2(invoice.amount_paid)}
                </span>
              </div>
              
              <div style={thermalStyles.totalLine}>
                <span style={thermalStyles.totalLabel}>Balance:</span>
                <span style={thermalStyles.totalAmount}>
                  {invoice.currency}{this.formatCurrency2(invoice.amount - invoice.amount_paid)}
                </span>
              </div>
              
              {prev_balance > 0 && (
                <div style={thermalStyles.totalLine}>
                  <span style={thermalStyles.totalLabel}>Prev. Balance:</span>
                  <span style={thermalStyles.totalAmount}>
                    {invoice.currency}{this.formatCurrency2(prev_balance)}
                  </span>
                </div>
              )}
              
              <div style={{ ...thermalStyles.totalLine, ...thermalStyles.grandTotal }}>
                <span style={thermalStyles.totalLabel}>TOTAL BALANCE:</span>
                <span style={thermalStyles.totalAmount}>
                  {invoice.currency}{this.formatCurrency2(total_balance)}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={thermalStyles.divider}>
              {"=".repeat(32)}
            </div>

            {/* Footer */}
            <footer style={thermalStyles.footer}>
              {company?.invoice_footer_one && (
                <div style={{ marginBottom: "2px" }}>{company.invoice_footer_one}</div>
              )}
              {company?.invoice_footer_two && (
                <div style={{ marginBottom: "2px" }}>{company.invoice_footer_two}</div>
              )}
              
              <div style={{ marginTop: "5px", fontSize: "8px" }}>
                Cashier: {invoice.cashier_name}
              </div>
              
              <div style={{ marginTop: "3px", fontSize: "8px" }}>
                Thank you for your business!
              </div>
            </footer>
          </>
        )}
      </div>
    );
  }
}

export default Invoice;