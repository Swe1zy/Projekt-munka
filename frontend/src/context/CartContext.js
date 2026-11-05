import { createContext, useContext } from 'react';

export const MAX_MENNYISEG = 999;

export const CartContext = createContext(null);

export const useCart = () => useContext(CartContext);
