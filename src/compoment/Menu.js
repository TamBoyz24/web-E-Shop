import { Link } from "react-router-dom";

function Menu() {
  return (
    <div className="menu">
      <button className="menu-btn">Danh Mục</button>
      <div className="menu-dropdown">
        <Link to="/samsung">Samsung</Link>
        <Link to="/iphone">iPhone</Link>
        <Link to="/redmi">Redmi</Link>
      </div>
    </div>
  );
}

export default Menu;
