// import React from "react";
// import { Card, Table } from "@themesberg/react-bootstrap";
// import moment from "moment";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPhone, faGlobe } from "@fortawesome/free-solid-svg-icons";
// import { toWords } from "../../services/numberWordService";

// export class Invoice extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       search: "",
//       company: props.company,
//       user: props.user,
//       loading: false,
//       saving: false,
//     };
//   }

//   getWords(amount) {
//     return toWords(amount);
//   }

//   totalCost = () => {
//     const { items } = this.props;
//     return items.reduce((total, item) => total + item.rate * item.quantity, 0);
//   };

//   formatCurrency2(x) {
//     if (x) {
//       const parts = x.toString().split(".");
//       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
//       return `${parts.join(".")}`;
//     }
//     return "0";
//   }

//   formatCurrency(x) {
//     return x.toLocaleString(undefined, { minimumFractionDigits: 2 });
//   }

//   combineItems = (items) => {
//     return items.reduce((acc, item) => {
//       // Find an existing item with the same product_name and selling_price
//       const existingItem = acc.find(
//         (i) =>
//           i.order.product_name === item.order.product_name &&
//           i.selling_price === item.selling_price
//       );

//       if (existingItem) {
//         // Increment qty_sold if an item with matching name and price exists
//         existingItem.qty_sold += item.qty_sold;
//       } else {
//         // Push the item as a new entry if no match was found
//         acc.push({ ...item });
//       }

//       return acc;
//     }, []);
//   };

//   render() {
//     const { invoice, company, items, pos_items, total_balance, prev_balance } =
//       this.props;
//     const combinedItems = this.combineItems(pos_items);

//     return (
//       <Card style={{ padding: "10px", width: "100%" }}>
//         {Object.keys(invoice).length !== 0 && (
//           <div>
//             <header
//               style={{
//                 textAlign: "center",
//                 marginBottom: "10px",
//                 fontSize: "24px",
//                 fontWeight: "bold",
//               }}
//             >
//               <h1 style={{ fontWeight: "bold" }}>{company?.name || ""}</h1>
//               <div style={{ fontWeight: "bold" }}>
//                 <FontAwesomeIcon icon={faPhone} /> {company.phone_one},{" "}
//                 {company.phone_two}
//               </div>
//               <div style={{ fontWeight: "bold" }}>
//                 <FontAwesomeIcon icon={faGlobe} /> {company.website}
//               </div>
//             </header>

//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 fontSize: "20px",
//                 marginBottom: "10px",
//                 fontWeight: "bold",
//               }}
//             >
//               <div style={{ textAlign: "left", fontWeight: "bold" }}>
//                 Date: {moment(invoice.created_at).format("MMM DD YYYY, h:mm A")}
//                 <br />
//                 Invoice #: {invoice.invoice_no}
//                 <br />
//                 {company.address}
//               </div>
//               <div style={{ textAlign: "right", fontWeight: "bold" }}>
//                 <strong>Customer</strong>
//                 <br />
//                 {invoice.client.name}
//                 <br />
//                 {invoice.client.phone}
//                 <br />
//                 {invoice.client.address}
//                 <br />
//                 {invoice.client.email || ""}
//               </div>
//             </div>

//             <Table
//               striped
//               bordered
//               hover
//               style={{ marginBottom: "10px", fontSize: "20px" }}
//             >
//               <thead>
//                 <tr>
//                   <th style={{ fontSize: "20px", fontWeight: "bold" }}>
//                     Product
//                   </th>
//                   <th style={{ fontSize: "20px", fontWeight: "bold" }}>Qty</th>
//                   <th style={{ fontSize: "20px", fontWeight: "bold" }}>
//                     Price
//                   </th>
//                   <th style={{ fontSize: "20px", fontWeight: "bold" }}>
//                     Amount
//                   </th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {combinedItems.map((item, index) => (
//                   <tr key={index}>
//                     <td
//                       style={{
//                         fontSize: "20px",
//                         textTransform: "uppercase",
//                         fontWeight: "bold",
//                       }}
//                     >
//                       {item.order.product_name}
//                     </td>
//                     <td style={{ fontSize: "20px", fontWeight: "bold" }}>
//                       {item.qty_sold}
//                     </td>
//                     <td style={{ fontSize: "20px", fontWeight: "bold" }}>
//                       {this.formatCurrency(item.selling_price)}
//                     </td>
//                     <td style={{ fontSize: "20px", fontWeight: "bold" }}>
//                       {this.formatCurrency(item.selling_price * item.qty_sold)}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </Table>

//             <div
//               style={{
//                 fontWeight: "bold",
//                 fontSize: "22px",
//                 textAlign: "right",
//                 marginBottom: "10px",
//               }}
//             >
//               Total: {invoice.currency}
//               {this.formatCurrency2(invoice.amount)}
//               <br />
//               Paid: {invoice.currency}
//               {this.formatCurrency2(invoice.amount_paid)}
//               <br />
//               Balance: {invoice.currency}
//               {invoice.amount - invoice.amount_paid}
//               <br />
//               Previous Balance: {invoice.currency}
//               {prev_balance}
//               <br />
//               Total Balance: {invoice.currency}
//               {this.formatCurrency2(total_balance)}
//             </div>

//             <footer
//               style={{
//                 fontSize: "20px",
//                 marginTop: "10px",
//                 textAlign: "center",
//                 fontWeight: "bold",
//               }}
//             >
//               <div style={{ fontWeight: "bold" }}>
//                 {company?.invoice_footer_one}
//               </div>
//               <div style={{ fontWeight: "bold" }}>
//                 {company?.invoice_footer_two}
//               </div>
//               <div style={{ fontWeight: "bold", marginTop: "10px" }}>
//                 Cashier: {invoice.cashier_name}
//               </div>
//             </footer>
//           </div>
//         )}
//       </Card>
//     );
//   }
// }

// export default Invoice;
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
    const { invoice, company, items, pos_items, total_balance, prev_balance } =
      this.props;
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
