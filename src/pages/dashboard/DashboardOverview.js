import React, { Component } from 'react';
import { 
  Row, 
  Col, 
  Button, 
  Card, 
  Statistic, 
  Spin, 
  Typography, 
  Space,
  Divider 
} from 'antd';
import {
  UserOutlined,
  BankOutlined,
  ShopOutlined,
  CarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { getDashboardDetails } from '../../services/userService';
import moment from "moment";

const { Title } = Typography;

export class DashboardOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      supplier_count: 0,
      branch_count: 0,
      product_count: 0,
      fromdate: moment().startOf('month'),
      todate: moment().endOf('day'),
      total_sales: 0,
      total_purchases: 0,
      user: JSON.parse(localStorage.getItem('user')),
      loading: false
    };
  }

  componentDidMount() {
    this.getDashboardDetails();
  }

  logOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem('token');
    localStorage.clear();
    let path = '/auth/sign-in';
    this.props.history.push(path);
  }

  getDashboardDetails = () => {
    this.setState({ loading: true });
    const { fromdate, todate } = this.state;
    getDashboardDetails({ fromdate, todate }).then(
      (res) => {
        console.log(res);
        this.setState({
          loading: false,
          users: res.users,
          product_count: res.product_count,
          supplier_count: res.supplier_count,
          branch_count: res.branch_count,
          total_sales: res.total_sales,
          total_purchases: res.total_purchases
        });
      },
      (error) => {
        this.setState({ loading: false });
      }
    );
  };

  formatCurrency(x) {
    if (x !== null && x !== 0 && x !== undefined) {
      const parts = x.toString().split(".");
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `₦${parts.join(".")}`;
    }
    return '₦0';
  }

  render() {
    const {
      loading,
      users,
      user,
      supplier_count,
      total_purchases,
      product_count,
      total_sales,
      branch_count
    } = this.state;

    const cardStyle = {
      borderRadius: '12px',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      color: 'white',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    };

    const alternateCardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #744c80 0%, #553c62 100%)'
    };

    const thirdCardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #2b6cb0 0%, #2c5282 100%)'
    };

    const fourthCardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #2f855a 0%, #276749 100%)'
    };

    const fifthCardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #c05621 0%, #9c4221 100%)'
    };

    const sixthCardStyle = {
      ...cardStyle,
      background: 'linear-gradient(135deg, #805ad5 0%, #6b46c1 100%)',
      color: 'white'
    };

    return (
      <div style={{ 
        padding: '24px', 
        // background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%)',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <Spin spinning={loading} tip="Loading dashboard data..." size="large">
          {/* Header Section */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '32px',
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
          }}>
            <Title 
              level={2} 
              style={{ 
                margin: 0, 
                color: 'black',
                fontSize: '32px',
                fontWeight: '700',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              {user?.branch_name || 'Dashboard'}
            </Title>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={this.logOut}
              size="large"
              style={{ 
                borderRadius: '8px',
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
              }}
            >
              Sign Out
            </Button>
          </div>

          {/* Stats Cards */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card 
                style={cardStyle}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <UserOutlined style={{ fontSize: '36px', color: 'white' }} />
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '500' }}>Users</span>}
                    value={users.length}
                    valueStyle={{ color: 'white', fontSize: '32px', fontWeight: '700' }}
                  />
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card 
                style={alternateCardStyle}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0, 0, 0, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <BankOutlined style={{ fontSize: '36px', color: 'white' }} />
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '500' }}>Branches</span>}
                    value={branch_count}
                    valueStyle={{ color: 'white', fontSize: '32px', fontWeight: '700' }}
                  />
                </Space>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={8} xl={6}>
              <Card 
                style={thirdCardStyle}
                hoverable
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                }}
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <ShopOutlined style={{ fontSize: '36px', color: 'white' }} />
                  <Statistic
                    title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '500' }}>Products</span>}
                    value={product_count}
                    valueStyle={{ color: 'white', fontSize: '32px', fontWeight: '700' }}
                  />
                </Space>
              </Card>
            </Col>

            {user?.admin === 1 && (
              <>
                <Col xs={24} sm={12} lg={8} xl={6}>
                  <Card 
                    style={fourthCardStyle}
                    hoverable
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <CarOutlined style={{ fontSize: '36px', color: 'white' }} />
                      <Statistic
                        title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '500' }}>Suppliers</span>}
                        value={supplier_count}
                        valueStyle={{ color: 'white', fontSize: '32px', fontWeight: '700' }}
                      />
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={8} xl={6}>
                  <Card 
                    style={fifthCardStyle}
                    hoverable
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <ShoppingCartOutlined style={{ fontSize: '36px', color: 'white' }} />
                      <Statistic
                        title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: '500' }}>Total Purchase Orders</span>}
                        value={this.formatCurrency(total_purchases)}
                        valueStyle={{ color: 'white', fontSize: '24px', fontWeight: '700' }}
                      />
                    </Space>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={8} xl={6}>
                  <Card 
                    style={sixthCardStyle}
                    hoverable
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <DollarOutlined style={{ fontSize: '36px', color: 'rgba(255,255,255,0.8)' }} />
                      <Statistic
                        title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: '500' }}>Sales</span>}
                        value={this.formatCurrency(total_sales)}
                        valueStyle={{ color: 'white', fontSize: '32px', fontWeight: '700' }}
                      />
                    </Space>
                  </Card>
                </Col>
              </>
            )}
          </Row>
        </Spin>
      </div>
    );
  }
}

export default DashboardOverview;