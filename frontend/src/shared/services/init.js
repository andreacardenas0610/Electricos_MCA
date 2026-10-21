import { asegurarClientes } from './clientesService.js';
import { asegurarTerceros } from './tercerosService.js';
import { asegurarServicios } from './serviciosService.js';
import { asegurarMateriales } from './materialesService.js';
import { asegurarCotizaciones } from './cotizacionesService.js';
import { asegurarPagos } from './pagosService.js';
import { asegurarAgenda } from './agendaService.js';
import { asegurarOrdenes } from './ordenesService.js';
import { asegurarUsuarios } from './usuariosService.js';
import { asegurarRoles } from './rolesService.js';

let inicializado = false;

export function inicializarDatos() {
  if (inicializado) return true;
  inicializado = true;

  try {
    asegurarClientes();
    asegurarTerceros();
    asegurarServicios();
    asegurarMateriales();
    asegurarCotizaciones();
    asegurarPagos();
    asegurarAgenda();
    asegurarOrdenes();
    asegurarUsuarios();
    asegurarRoles();
  } catch (error) {
    console.error('No se pudieron inicializar los datos locales de Eléctricos MCA.', error);
  }

  return true;
}
