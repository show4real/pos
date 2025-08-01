import React, { Component } from "react";
import moment from "moment";

export class TransactionPrintComponent extends Component {
  // Method to combine products with the same product_id AND same selling_price
  combineProducts = (transactionDetails) => {
    const productMap = new Map();
    
    transactionDetails.forEach((item) => {
      const productId = item.product_id || item.id; // Handle both product_id and id
      const sellingPrice = item.selling_price;
      
      // Create a unique key combining product ID and selling price
      const uniqueKey = `${productId}_${sellingPrice}`;
      
      if (productMap.has(uniqueKey)) {
        // Product with same ID and price already exists, combine quantities and recalculate total
        const existing = productMap.get(uniqueKey);
        existing.qty_sold += item.qty_sold;
        existing.total = existing.qty_sold * existing.selling_price;
      } else {
        // New product or same product with different price, add to map with calculated total
        productMap.set(uniqueKey, {
          ...item,
          total: item.qty_sold * item.selling_price
        });
      }
    });
    
    return Array.from(productMap.values());
  };

  // Calculate subtotal from combined products
  getSubtotal = (combinedProducts) => {
    return combinedProducts.reduce((sum, item) => sum + item.total, 0);
  };

  render() {
    const { 
      transaction_detail, 
      company, 
      invoice_data, 
      transaction_id,
      transaction_date_time,
      payment_mode,
      cashier_name,
      transaction_total,
      balance,
      prev_balance,
      total_balance,
      delivery_fee,
      discount,
      discount_percent
    } = this.props;

    // Combine products with the same product_id and selling_price
    const combinedProducts = this.combineProducts(transaction_detail || []);
    
    // Calculate subtotal
    const subtotal = this.getSubtotal(combinedProducts);
    
    // Calculate final total with discount and delivery fee
    const calculatedTotal = subtotal - (discount || 0) + (delivery_fee || 0);

    return (
      <div className="print-container" style={{ display: 'none' }}>
        <div className="print-content" style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          margin: '0 auto',
          backgroundColor: 'white',
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          lineHeight: '1.4',
          color: '#000'
        }}>
          {/* Header Section */}
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '20px' }}>
            {/* Logo */}
            {company?.logo_url && (
              <div style={{ marginBottom: '15px' }}>
                <img 
                  src={company.logo_url} 
                  alt="Company Logo" 
                  style={{ 
                    maxWidth: '80px', 
                    maxHeight: '80px', 
                    objectFit: 'contain' 
                  }} 
                />
              </div>
            )}
            
            <h1 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
              {company?.name || 'Company Name'}
            </h1>
            
            {company?.invoice_header && (
              <h2 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'normal', fontStyle: 'italic' }}>
                {company.invoice_header}
              </h2>
            )}
            
            {company?.address && (
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Address:</strong> {company.address}
              </p>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {company?.phone_one && (
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Tel:</strong> {company.phone_one}
                </p>
              )}
              {company?.phone_two && (
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Tel:</strong> {company.phone_two}
                </p>
              )}
            </div>
            
            {company?.email && (
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Email:</strong> {company.email}
              </p>
            )}
            {company?.website && (
              <p style={{ margin: '5px 0', fontSize: '14px' }}>
                <strong>Website:</strong> {company.website}
              </p>
            )}
          </div>

          {/* Transaction Info Section */}
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ margin: '0 0 15px 0', fontSize: '18px', fontWeight: 'bold', textAlign: 'center' }}>
              TRANSACTION RECEIPT
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ width: '48%' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Transaction ID:</strong> {transaction_id}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Invoice No:</strong> {invoice_data?.invoice_no || 'N/A'}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Date:</strong> {moment(transaction_date_time).format("MMM D, YYYY")}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Time:</strong> {moment(transaction_date_time).format("hh:mm A")}
                </p>
              </div>
              <div style={{ width: '48%' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Cashier:</strong> {cashier_name}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Payment Mode:</strong> {payment_mode}
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Client:</strong> {invoice_data?.client_name || 'Walk-in Customer'}
                </p>
                {/* Show discount percentage if applied */}
                {discount_percent > 0 && (
                  <p style={{ margin: '5px 0', color: '#28a745', fontWeight: 'bold' }}>
                    <strong>Discount Applied:</strong> {discount_percent}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div style={{ marginBottom: '30px' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              border: '1px solid #000',
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}>
                    #
                  </th>
                  <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'left',
                    fontWeight: 'bold'
                  }}>
                    Product Name
                  </th>
                  <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    Unit Price
                  </th>
                  <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    Quantity
                  </th>
                  {/* <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}>
                    Supplier
                  </th> */}
                  <th style={{ 
                    border: '1px solid #000', 
                    padding: '8px', 
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {combinedProducts.map((item, index) => (
                  <tr key={item.product_id || item.id || index}>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                      {index + 1}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>
                      {item.product_name}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {this.props.formatNumber(item.selling_price)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {item.qty_sold}
                    </td>
                    {/* <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>
                      {item.supplier_name || 'N/A'}
                    </td> */}
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>
                      {this.props.formatNumber(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Section with Calculation Breakdown */}
          <div style={{ marginBottom: '20px' }}>
            {/* Subtotal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              fontSize: '14px'
            }}>
              <span>Subtotal:</span>
              <span>{(company?.currency || '')} {this.props.formatNumber(subtotal)}</span>
            </div>

            {/* Discount (if applied) */}
            {discount > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '14px',
                color: '#28a745'
              }}>
                <span>Discount ({discount_percent}%):</span>
                <span>-{(company?.currency || '')} {this.props.formatNumber(discount)}</span>
              </div>
            )}

            {/* Delivery Fee */}
            {delivery_fee > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '10px',
                fontSize: '14px'
              }}>
                <span>Delivery Fee:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(delivery_fee)}</span>
              </div>
            )}

            {/* Total */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '15px',
              borderTop: '2px solid #000',
              borderBottom: '1px solid #000',
              paddingTop: '10px',
              paddingBottom: '10px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              <span><strong>TOTAL:</strong></span>
              <span><strong>{(company?.currency || '')} {this.props.formatNumber(transaction_total || calculatedTotal)}</strong></span>
            </div>

            {/* Amount Paid */}
            {invoice_data?.amount_paid !== undefined && invoice_data?.amount_paid !== null && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span>Amount Paid:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(invoice_data.amount_paid)}</span>
              </div>
            )}

            {/* Current Balance */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '8px',
              fontSize: '12px'
            }}>
              <span>Current Balance:</span>
              <span>{(company?.currency || '')} {this.props.formatNumber(balance !== undefined && balance !== null ? balance : 0)}</span>
            </div>

            {/* Previous Balance */}
            {prev_balance !== undefined && prev_balance !== null && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '8px',
                fontSize: '12px'
              }}>
                <span>Previous Balance:</span>
                <span>{(company?.currency || '')} {this.props.formatNumber(prev_balance)}</span>
              </div>
            )}

            {/* Total Balance */}
            {total_balance !== undefined && total_balance !== null && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                marginBottom: '15px',
                borderTop: '1px solid #000',
                paddingTop: '10px',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                <span><strong>TOTAL BALANCE:</strong></span>
                <span><strong>{(company?.currency || '')} {this.props.formatNumber(total_balance)}</strong></span>
              </div>
            )}

            {/* Savings Summary (if discount applied) */}
            {discount > 0 && (
              <div style={{ 
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                padding: '10px',
                marginTop: '15px',
                textAlign: 'center'
              }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#155724',
                  marginBottom: '5px'
                }}>
                  🎉 YOU SAVED: {(company?.currency || '')} {this.props.formatNumber(discount)}
                </div>
                <div style={{ fontSize: '12px', color: '#155724' }}>
                  With {discount_percent}% discount applied
                </div>
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div style={{ marginBottom: '20px', fontSize: '10px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
              Terms and Conditions:
            </h3>
            <div style={{ textAlign: 'justify', lineHeight: '1.3' }}>
              {company?.invoice_footer_two || 'Good sold in good condition are not returnable'}
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '40px', 
            borderTop: '1px solid #000', 
            paddingTop: '15px',
            fontSize: '12px'
          }}>
            <p style={{ margin: '5px 0', fontWeight: 'bold' }}>
              {company?.invoice_footer_one || 'Thank you for your business!'}
            </p>
            <p style={{ margin: '5px 0', fontSize: '10px' }}>
              Generated on: {moment().format("MMM D, YYYY hh:mm A")}
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default TransactionPrintComponent;