import Presentation from "./pages/Presentation";
import Upgrade from "./pages/Upgrade";
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";
import BootstrapTables from "./pages/tables/BootstrapTables";
import Index from "./pages/users/Index";
import Product from "./pages/products/Product";
import StockIndex from "./pages/stock/StockIndex";
import SingleProduct from "./pages/products/SingleProduct";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Lock from "./pages/examples/Lock";
import NotFoundPage from "./pages/examples/NotFound";
import ServerError from "./pages/examples/ServerError";
import {
  faBook,
  faBoxOpen,
  faChartPie,
  faShoppingBag,
  faCog,
  faFileAlt,
  faHandHoldingUsd,
  faIcons,
  faSignOutAlt,
  faTable,
  faTimes,
  faUsers,
  faTruck,
  faTruckLoading,
  faTruckMoving,
  faThermometer,
  faRuler,
  faCalculator,
  faFileInvoice,
  faUser,
  faCreditCard,
  faMoneyBillWaveAlt,
  faBarcode,
} from "@fortawesome/free-solid-svg-icons";
import {
  faProductHunt,
  faSalesforce,
} from "@fortawesome/free-brands-svg-icons";
import SupplierIndex from "./pages/suppliers/SupplierIndex";
import StockIndex2 from "./pages/stock/StockIndex2";
import SalesOrderIndex from "./pages/sales/SalesOrderIndex";
import PosOrderIndex from "./pages/pos/PosOrderIndex";
import InvoiceIndex from "./pages/invoice/InvoiceIndex";
import PosTransaction from "./pages/pos/PosTransaction";
import Profile from "./pages/company/Profile";
import OrderIndex from "./pages/purchase/OrderIndex";
import BranchIndex from "./pages/stocks/BranchIndex";
import CreditorIndex from "./pages/creditors/CreditorIndex";
import ExpenseIndex from "./pages/expenses/ExpenseIndex";
import Barcode from "./pages/barcode/Barcode";
export let routes = [
  {
    path: "/",
    component: DashboardOverview,
    title: "Dashboard",
    icon: faChartPie,
  },
  {
    path: "/company-profile",
    component: Profile,
    title: "Company Profile",
    icon: faUser,
  },
  { path: "/users", component: Index, title: "Users", icon: faUsers },
  {
    path: "/suppliers",
    component: SupplierIndex,
    title: "Suppliers",
    icon: faTruck,
  },
  {
    path: "/products",
    component: Product,
    title: "Products",
    icon: faTruckLoading,
  },
  {
    path: "/purchase_orders",
    component: OrderIndex,
    title: "Purchase Order",
    icon: faShoppingBag,
  },
  {
    path: "/stocked",
    component: BranchIndex,
    title: "Stocks",
    icon: faTruckMoving,
  },
  {
    path: "/sales_order",
    component: SalesOrderIndex,
    title: "Sales Order",
    icon: faSalesforce,
  },
  // { path: "/creditors", component: CreditorIndex, title:"Creditors", icon:faCreditCard },
  

  {
    path: "/pos_transactions",
    component: PosTransaction,
    title: "Transactions",
    icon: faCalculator,
  },
  {
    path: "/barcode",
    component: Barcode,
    title: "Barcode",
    icon: faBarcode,
  },
  {
    path: "/expenses",
    component: ExpenseIndex,
    title: "Expenses",
    icon: faMoneyBillWaveAlt,
  },
];
