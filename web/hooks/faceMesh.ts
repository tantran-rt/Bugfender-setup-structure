// import { useState, useEffect } from "react";
// import * as ml5 from "ml5";
// import { toast } from "react-toastify";


// const useFaceMesh = () => {
//   const [faceMesh, setFaceMesh] = useState<any>(null);


//   useEffect(() => {
//     const loadFaceMesh = async () => {
//       try {
//         const model = await ml5.facemesh();
//         setFaceMesh(model);
//       } catch (error) {
//         console.error("Error loading face mesh model:", error);
//         toast.error("Error loading face mesh model.");
//       }
//     };

//     loadFaceMesh();
//   }, []);

//   return faceMesh;
// };

// export default useFaceMesh;

