module.exports = {
    routesConfig: [
      // auth router
      { path: '/adminLogin', methods: ['POST'] },

      { path: '/createEmployee', methods: ['POST'] },
      { path: '/getEmployees', methods: ['GET'] },
      { path: '/deleteEmployees', methods: ['DELETE'] },
      { path: '/updateEmployee', methods: ['PUT'] },
      { path: '/deleteDocument', methods: ['DELETE'] },

      { path: '/markAttendance', methods: ['POST'] },
      { path: '/attendanceByDate', methods: ['GET'] },
      { path: '/attendanceHistory', methods: ['GET'] },
  
      { path: '/dashboardSummary', methods: ['GET'] },

    ]
  };