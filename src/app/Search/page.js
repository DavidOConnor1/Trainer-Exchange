'use client';//uses client server

import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import { pokemonApi } from "../lib/pokemon-card-api";

export default function SearchPage() {
  const [searchResults, setSearchResults] = useState([]);
}