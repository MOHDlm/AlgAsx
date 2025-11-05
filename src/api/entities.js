
export const Property = {
  getAll: () => [
    {
      id: 1,
      name: "Central Business Tower",
      location: "Downtown",
      price: "$250,000",
      roi: "8.5%",
    },
    {
      id: 2,
      name: "Oasis Residential Complex",
      location: "Uptown",
      price: "$180,000",
      roi: "9.2%",
    },
  ],
};

export const Investment = {
  getUserInvestments: () => [
    {
      id: 1,
      property: "Central Business Tower",
      amount: "$10,000",
      return: "8.5%",
    },
    {
      id: 2,
      property: "Oasis Residential Complex",
      amount: "$7,500",
      return: "9.2%",
    },
  ],
};

export const User = {
  current: { name: "Local User", email: "user@localhost" },
  login: () => console.log("Local login called (mock)"),
  logout: () => console.log("Local logout called (mock)"),
};
