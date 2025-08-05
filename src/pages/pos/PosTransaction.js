import React, { Component } from "react";
import { Input } from "reactstrap";
import { getPosTransactions2 } from "../../services/posOrderService";
import { toast } from "react-toastify";
import moment from "moment";
import {
  Col,
  Row,
  Card,
  Table,
  Button,
  ButtonGroup,
  Breadcrumb,
  Form,
  Badge,
  Container,
} from "@themesberg/react-bootstrap";
import SpinDiv from "../components/SpinDiv";
import 'antd/dist/antd.css';
import { Pagination } from 'antd';
import ReactDatetime from "react-datetime";
import TransactionDetail from "./TransactionDetail";

export class PosTransaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      page: 1,
      rows: 10,
      loading: false,
      order: "",
      products: [],
      users: [],
      user: '',
      total: 0,
      pos_sales: [],
      total_sales: 0,
      total_amount_paid: 0,
      total_amount: 0,
      total_delievery_fee: 0,
      total_discount: 0,
      fromdate: moment().startOf('month'),
      todate: moment().endOf('day'),
      u: JSON.parse(localStorage.getItem("user")),
      showFilter: false,
      transaction_id: null,
    };
  }

  componentDidMount() {
    this.getPosTransactions();
  }

  showToast = (msg) => {
    toast(<div style={{ padding: 20, color: "success" }}>{msg}</div>);
  };

  getPosTransactions = () => {
    const { page, rows, order, todate, fromdate, search, user } = this.state;
    this.setState({ loading: true });

    getPosTransactions2({ page, rows, fromdate, todate, order, user, search }).then(
      (res) => {
        this.setState({
          loading: false,
          pos_sales: res.pos_sales.data,
          users: res.users,
          total: res.pos_sales.total,
          total_sales: res.total_sales,
          total_amount: res.total_amount,
          total_amount_paid: res.total_amount_paid,
          total_discount: res.total_discount,
          total_delievery_fee: res.total_delivery_fee

        });
      },
      (error) => {
        this.setState({ loading: false });
        toast.error("Failed to load transactions");
      }
    );
  };

  formatCurrency = (x) => {
    if (x !== null && x !== 0 && x !== undefined) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `₦${parts.join(".")}`;
    }
    return '₦0';
  }

  getChannelBadge = (channel) => {
    const channelConfig = {
      'pos_order': { variant: 'success', icon: 'fas fa-cash-register', label: 'POS Sales' },
      'sales_order': { variant: 'primary', icon: 'fas fa-store', label: 'Internal Sales' },
      'online_order': { variant: 'info', icon: 'fas fa-globe', label: 'Online Sales' }
    };

    const config = channelConfig[channel] || { variant: 'secondary', icon: 'fas fa-question', label: channel };

    return (
      <Badge bg={config.variant} className="d-flex align-items-center gap-1" style={{ fontSize: '14px' }}>
        <i className={config.icon} style={{ fontSize: '12px' }}></i>
        {config.label}
      </Badge>
    );
  };

  toggleFilter = () => {
    this.setState({ showFilter: !this.state.showFilter });
  };

  onPage = async (page, rows) => {
    await this.setState({ page, rows });
    await this.getPosTransactions();
  }

  onFilter = async (e, filter) => {
    await this.setState({ [filter]: e });
    await this.getPosTransactions();
  };

  toggleViewTransaction = (transaction_id) => {
    this.setState({ transaction_id });
  };

  onChange = (e, state) => {
    this.setState({ [state]: e });
  };

  handleSearchSubmit = () => {
    this.getPosTransactions();
    this.setState({ search: "" });
  };

  render() {
    const {
      pos_sales,
      users,
      user,
      u,
      page,
      rows,
      search,
      loading,
      order,
      showFilter,
      total,
      fromdate,
      todate,
      transaction_id,
      total_sales,
      total_amount,
      total_amount_paid,
      total_discount,
      total_delievery_fee
    } = this.state;

    const unique_transaction = Array.from(
      pos_sales.reduce((a, o) => a.set(o.transaction_id, o), new Map()).values()
    );

    return (
      <>
        {transaction_id && (
          <TransactionDetail
            saved={this.getPosTransactions}
            transaction_id={transaction_id}
            toggle={() => this.setState({ transaction_id: false })}
          />
        )}

        {loading && <SpinDiv text={"Loading..."} />}

        <Container fluid className="py-4">
          {/* Header Section */}
          <Row className="align-items-center mb-4">
            <Col>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <Breadcrumb className="breadcrumb-text-dark text-primary mb-2">
                    <Breadcrumb.Item href="/">
                      <i className="fas fa-home me-1"></i>Home
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active>
                      <i className="fas fa-receipt me-1"></i>Transactions
                    </Breadcrumb.Item>
                  </Breadcrumb>
                  <div className="d-flex align-items-center gap-3">
                    <h4 className="mb-0 fw-bold text-dark">
                      <i className="fas fa-receipt text-primary me-2"></i>
                      Transactions
                      <Badge bg="light" text="dark" className="ms-2 fs-6">
                        {pos_sales.length}
                      </Badge>
                    </h4>
                  </div>
                </div>
                <div className="d-flex gap-3">
                  <div className="bg-gradient-success text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Total Sales</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_sales)}</div>
                  </div>
                  
                  <div className="bg-gradient-warning text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Total Discount</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_discount)}</div>
                  </div>
                  <div className="bg-gradient-secondary text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Delivery Fees</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_delievery_fee)}</div>
                  </div>
                  <div className="bg-gradient-primary text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Total Amount</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_amount)}</div>
                  </div>
                  <div className="bg-gradient-info text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Amount Paid</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_amount_paid)}</div>
                  </div>
                  <div className="bg-gradient-danger text-white rounded-3 p-3 shadow-sm">
                    <div className="small text-white-50 mb-1">Balance</div>
                    <div className="h5 mb-0 fw-bold">{this.formatCurrency(total_amount - total_amount_paid)}</div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>


          {/* Filters Section */}
          <Card className="shadow-sm mb-4 border-0">
            <Card.Header className="bg-light border-0 py-3">
              <Row className="align-items-center g-3">
                {/* Date Filters */}
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted mb-1">From Date</Form.Label>
                    <ReactDatetime
                      value={fromdate}
                      dateFormat={'MMM D, YYYY'}
                      closeOnSelect
                      onChange={e => this.onFilter(e, 'fromdate')}
                      inputProps={{
                        required: true,
                        className: 'form-control form-control-sm'
                      }}
                      isValidDate={(current) => {
                        return (current.isBefore(todate) || current.isSame(todate)) && current.isBefore(moment());
                      }}
                      timeFormat={false}
                    />
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted mb-1">To Date</Form.Label>
                    <ReactDatetime
                      value={todate}
                      dateFormat={'MMM D, YYYY'}
                      closeOnSelect
                      onChange={e => this.onFilter(e, 'todate')}
                      inputProps={{
                        required: true,
                        className: 'form-control form-control-sm'
                      }}
                      isValidDate={(current) => {
                        return (current.isAfter(fromdate) || current.isSame(fromdate)) && current.isBefore(moment());
                      }}
                      timeFormat={false}
                    />
                  </Form.Group>
                </Col>

                {/* Search */}
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-semibold text-muted mb-1">Search Transactions</Form.Label>
                    <div className="input-group">
                      <Input
                        placeholder="Search by transaction ID, cashier..."
                        className="form-control-sm"
                        value={search}
                        onChange={(e) => this.onChange(e.target.value, "search")}
                        onKeyUp={(e) => {
                          if (e.key === "Enter") {
                            this.handleSearchSubmit();
                          }
                        }}
                      />
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={this.handleSearchSubmit}
                      >
                        <i className="fas fa-search" />
                      </Button>
                    </div>
                  </Form.Group>
                </Col>

                {/* Filter Toggle */}
                <Col md={4} className="text-end">
                  <Button
                    variant={showFilter ? "warning" : "outline-secondary"}
                    size="sm"
                    onClick={this.toggleFilter}
                    className="d-flex align-items-center gap-2"
                  >
                    <i className={`fas fa-${showFilter ? 'eye-slash' : 'filter'}`}></i>
                    {showFilter ? 'Hide Filters' : 'Show Filters'}
                  </Button>
                </Col>
              </Row>

              {/* Advanced Filters */}
              {showFilter && (
                <Row className="mt-3 pt-3 border-top g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold text-muted mb-1">
                        <i className="fas fa-stream me-1"></i>Filter by Channel
                      </Form.Label>
                      <Form.Select
                        value={order}
                        size="sm"
                        onChange={(e) => this.onFilter(e.target.value, "order")}
                      >
                        <option value="">All Channels</option>
                        <option value="pos_order">POS Sales</option>
                        <option value="sales_order">Internal Sales</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  {u.admin === 1 && (
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold text-muted mb-1">
                          <i className="fas fa-user me-1"></i>Filter by User
                        </Form.Label>
                        <Form.Select
                          value={user}
                          size="sm"
                          onChange={(e) => this.onFilter(e.target.value, "user")}
                        >
                          <option value="">All Users</option>
                          {users.map((p) => (
                            <option value={p.id} key={p.id}>
                              {p.firstname + ' ' + p.lastname}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  )}
                </Row>
              )}
            </Card.Header>
          </Card>

          {/* Transactions Table */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table className="table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 fw-semibold text-dark py-3">
                        <i className="fas fa-user me-2 text-muted"></i>Cashier
                      </th>
                      <th className="border-0 fw-semibold text-dark py-3">
                        <i className="fas fa-hashtag me-2 text-muted"></i>Transaction ID
                      </th>
                      <th className="border-0 fw-semibold text-dark py-3">
                        <i className="fas fa-tags me-2 text-muted"></i>Channel
                      </th>
                      <th className="border-0 fw-semibold text-dark py-3">
                        <i className="fas fa-calendar me-2 text-muted"></i>Date
                      </th>
                      <th className="border-0 fw-semibold text-dark py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pos_sales.map((transaction, key) => (
                      <tr key={key} className="align-middle">
                        <td className="py-3">
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                              style={{ width: 40, height: 40 }}>
                              <i className="fas fa-user text-white small"></i>
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{transaction.cashier_name}</div>
                              <small className="text-muted">Cashier</small>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <code className="bg-light px-2 py-1 rounded text-dark">
                            {transaction.transaction_id}
                          </code>
                        </td>
                        <td className="py-3">
                          {this.getChannelBadge(transaction.channel)}
                        </td>
                        <td className="py-3">
                          <div className="text-dark">{moment(transaction.created_at).format('MMM DD, YYYY')}</div>
                          <small className="text-muted">{moment(transaction.created_at).format('h:mm A')}</small>
                        </td>
                        <td className="py-3 text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center gap-1 mx-auto"
                            onClick={() => this.toggleViewTransaction(transaction.transaction_id)}
                          >
                            <i className="fas fa-eye" style={{ fontSize: '12px' }}></i>
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Empty State */}
                {pos_sales.length < 1 && !loading && (
                  <div className="text-center py-5">
                    <div className="mb-3">
                      <i className="fas fa-receipt text-muted" style={{ fontSize: '48px' }}></i>
                    </div>
                    <h6 className="text-muted">No Transactions Found</h6>
                    <p className="text-muted small">Try adjusting your search criteria or date range</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pos_sales.length > 0 && (
                <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
                  <div className="text-muted small">
                    Showing {((page - 1) * rows) + 1} to {Math.min(page * rows, total)} of {total} transactions
                  </div>
                  <Pagination
                    showSizeChanger
                    total={total}
                    onChange={this.onPage}
                    pageSize={rows}
                    current={page}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} transactions`}
                    pageSizeOptions={['10', '25', '50', '100']}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }
}

export default PosTransaction;