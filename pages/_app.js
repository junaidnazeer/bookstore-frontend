import Head from "next/head";
import "../styles/globals.css";
import { CartProvider } from "../lib/cart-context";

export default function App({ Component, pageProps }) {
  return (
    <CartProvider>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>
      <Component {...pageProps} />
    </CartProvider>
  );
}
