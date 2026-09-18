import { useEffect, useState } from "react";


const Products = () => {

  const [data, setData] = useState([]);
  const [filter, setFilter] = useState(data);
  const [loading, setLoading] = useState(false);
  let compomentMounted = true;

  useEffect(() => {
        const getProducts = async () => {
          setLoading(true);
          const response = await fetch("https://fakestoreapi.com/products");
          if (compomentMounted) {
            setData(await response.clone().json());
            setFilter(await response.json());
            setLoading(false);
            console.log(filter)
          }
          return () => {
            compomentMounted = false;
          }
        }
        getProducts();
      }, []
  );


}

export default Products;