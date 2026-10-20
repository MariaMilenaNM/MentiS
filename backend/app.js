import express from "express";
import morgan from "morgan";
import cors from "cors";
import crudProfissional from "./crudnode/crudProfissionalRotas.js";
import crudPaciente from "./crudnode/crudPacienteRotas.js";

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(express.json()); 


app.use("/profissionais", crudProfissional);
app.use("/pacientes", crudPaciente);

app.listen(5000, () => {
    console.log("O servidor está rodando na porta 5000");
});