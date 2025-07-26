import React, { Component } from "react";
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Alert,
  Row,
  Col,
  Divider
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  EyeInvisibleOutlined, 
  EyeTwoTone,
  SafetyCertificateOutlined 
} from '@ant-design/icons';
import { login} from "../../services/authService";
import  { toast } from "react-toastify";

const { Title, Text, Link } = Typography;

export class Signin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: "",
      password: "",
      loading: false,
      error: null,
    };
  }

  onChange = (field, value) => {
    this.setState({ [field]: value, error: null });
  };

  isValid = () => {
    const { username, password } = this.state;
    const phone = /^([0]\d{10})$/;
    const email = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return (
      password != null &&
      password !== "" &&
      username &&
      (email.test(username.trim()) || phone.test(username.trim()))
    );
  };

  onSubmit=(e)=>{
    e.preventDefault();
    const { username, password } = this.state;
    console.log(username);

    this.setState({ loading: true });

    login({username,password}).then(
      (v)=>{
        this.setState({ loading: true });
        this.props.history.push("/");
      },
      (error) => {
        this.setState({ loading: false, password: "" });
        toast.dismiss();
        toast.configure({ hideProgressBar: true, closeButton: false });
        this.setState({ 
          loading: false, 
          password: "",
          error: "Invalid username or password. Please try again." 
        });
        
      }
    )
  }

  // onSubmit = () => {
  //   if (!this.isValid()) return;

  //   const { username, password } = this.state;
  //   this.setState({ loading: true, error: null });

  //   // Simulate login process
  //   setTimeout(() => {
  //     if (username === "admin@test.com" && password === "password") {
  //       this.setState({ loading: false });
  //       // Redirect logic would go here
  //       alert("Login successful!");
  //     } else {
  //       this.setState({ 
  //         loading: false, 
  //         password: "",
  //         error: "Invalid username or password. Please try again." 
  //       });
  //     }
  //   }, 1500);
  // };

  render() {
    const { loading, username, password, error } = this.state;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Row justify="center" style={{ width: '100%' }}>
          <Col xs={22} sm={16} md={12} lg={8} xl={6}>
            <Card
              style={{
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)'
              }}
              bodyStyle={{ padding: '40px 32px' }}
            >
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 32px rgba(24, 144, 255, 0.3)'
                }}>
                  <SafetyCertificateOutlined style={{ fontSize: '32px', color: 'white' }} />
                </div>
                <Title level={2} style={{ margin: '0 0 8px', color: '#1f2937' }}>
                  Inventory System
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Welcome back! Please sign in to continue.
                </Text>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert
                  message={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: '24px', borderRadius: '8px' }}
                  closable
                  onClose={() => this.setState({ error: null })}
                />
              )}

              {/* Form Fields */}
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <Text strong style={{ marginBottom: '8px', display: 'block', color: '#374151' }}>
                    Email or Username
                  </Text>
                  <Input
                    size="large"
                    placeholder="Enter your email or username"
                    prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                    value={username}
                    onChange={(e) => this.onChange('username', e.target.value)}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      height: '48px'
                    }}
                  />
                </div>

                <div>
                  <Text strong style={{ marginBottom: '8px', display: 'block', color: '#374151' }}>
                    Password
                  </Text>
                  <Input.Password
                    size="large"
                    placeholder="Enter your password"
                    prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                    value={password}
                    onChange={(e) => this.onChange('password', e.target.value)}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    style={{
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      height: '48px'
                    }}
                  />
                </div>

                {/* Forgot Password */}
                <div style={{ textAlign: 'right' }}>
                  <Link href="#" style={{ color: '#1890ff', fontWeight: 500 }}>
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  disabled={!this.isValid()}
                  onClick={this.onSubmit}
                  style={{
                    width: '100%',
                    height: '48px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '16px',
                    boxShadow: '0 4px 15px rgba(24, 144, 255, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(24, 144, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(24, 144, 255, 0.3)';
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Space>

              <Divider style={{ margin: '32px 0 24px' }} />

             
            </Card>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                © 2025 Inventory System. All rights reserved.
              </Text>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
}

export default Signin;