import { Contact, Deal, User, Conversation, Task } from '../types';

export const USERS: User[] = [
  { id: 'u1', name: 'Ana García', email: 'ana@winnershub.co', role: 'Supervisor', status: 'En línea', activeConversations: 3, lastAccess: '2024-05-28T09:00:00Z' },
  { id: 'u2', name: 'Pedro Ruiz', email: 'pedro@winnershub.co', role: 'Agente', status: 'Ocupado', activeConversations: 2, lastAccess: '2024-05-28T08:45:00Z' },
  { id: 'u3', name: 'Luis Mora', email: 'luis@winnershub.co', role: 'Agente', status: 'Ausente', activeConversations: 2, lastAccess: '2024-05-27T18:30:00Z' },
  { id: 'u4', name: 'Admin Sistema', email: 'admin@winnershub.co', role: 'Superadmin', status: 'En línea', activeConversations: 0, lastAccess: '2024-05-28T10:15:00Z' },
];

export const CONTACTS: Contact[] = [
  { id: 'c1', firstName: 'Carlos', lastName: 'Mendoza', role: 'CEO', company: 'TechSolutions S.A.', phone: '+57 310 555 0101', email: 'carlos@techsolutions.co', status: 'Cliente activo', agentId: 'u1', score: 92, tags: ['Premium', 'VIP'], city: 'Bogotá', country: 'Colombia', createdAt: '2024-01-15T10:00:00Z' },
  { id: 'c2', firstName: 'Laura', lastName: 'Gómez', role: 'Gerente de Marketing', company: 'Grupo Éxito', phone: '+57 315 555 0202', email: 'lgomez@grupoexito.com', status: 'Prospecto', agentId: 'u2', score: 78, tags: ['Seguimiento'], city: 'Medellín', country: 'Colombia', createdAt: '2024-02-20T11:30:00Z' },
  { id: 'c3', firstName: 'Andrés', lastName: 'Torres', role: 'CTO', company: 'FinStart SAS', phone: '+57 320 555 0303', email: 'atorres@finstart.co', status: 'Lead', agentId: 'u1', score: 65, tags: ['Demo agendada'], city: 'Bogotá', country: 'Colombia', createdAt: '2024-03-05T14:20:00Z' },
  { id: 'c4', firstName: 'Marcela', lastName: 'Ríos', role: 'Directora Comercial', company: 'Constructora Bolívar', phone: '+57 311 555 0404', email: 'mrios@constbol.com', status: 'Cliente activo', agentId: 'u3', score: 88, tags: ['Contrato enviado'], city: 'Cali', country: 'Colombia', createdAt: '2024-01-10T09:15:00Z' },
  { id: 'c5', firstName: 'Felipe', lastName: 'Vargas', role: 'Fundador', company: 'AgriTech Colombia', phone: '+57 318 555 0505', email: 'fvargas@agritech.co', status: 'Perdido', agentId: 'u2', score: 34, tags: [], city: 'Pereira', country: 'Colombia', createdAt: '2023-11-20T16:45:00Z' },
  { id: 'c6', firstName: 'Valentina', lastName: 'Ospina', role: 'VP Finanzas', company: 'Bancolombia Digital', phone: '+57 312 555 0606', email: 'vospina@bancoldigital.com', status: 'Cliente activo', agentId: 'u1', score: 95, tags: ['Premium', 'Urgente'], city: 'Medellín', country: 'Colombia', createdAt: '2023-12-05T08:30:00Z' },
  { id: 'c7', firstName: 'Santiago', lastName: 'Herrera', role: 'Gerente TI', company: 'Claro Colombia', phone: '+57 316 555 0707', email: 'sherrera@claro.co', status: 'Inactivo', agentId: 'u3', score: 52, tags: ['Requiere soporte'], city: 'Bogotá', country: 'Colombia', createdAt: '2024-04-12T13:10:00Z' },
  { id: 'c8', firstName: 'Diana', lastName: 'Morales', role: 'CEO', company: 'Salud360', phone: '+57 319 555 0808', email: 'dmorales@salud360.co', status: 'Prospecto', agentId: 'u2', score: 71, tags: ['Demo agendada'], city: 'Barranquilla', country: 'Colombia', createdAt: '2024-03-25T15:00:00Z' },
  { id: 'c9', firstName: 'Roberto', lastName: 'Castillo', role: 'Director Operaciones', company: 'LogiCol', phone: '+57 313 555 0909', email: 'rcastillo@logicol.co', status: 'Lead', agentId: 'u1', score: 60, tags: [], city: 'Bucaramanga', country: 'Colombia', createdAt: '2024-04-05T10:30:00Z' },
  { id: 'c10', firstName: 'Paola', lastName: 'Jiménez', role: 'CMO', company: 'FashionStore CO', phone: '+57 317 555 1010', email: 'pjimenez@fashionstore.co', status: 'Cliente activo', agentId: 'u3', score: 83, tags: ['Renovación próxima'], city: 'Cali', country: 'Colombia', createdAt: '2023-10-15T11:00:00Z' },
  { id: 'c11', firstName: 'Hernán', lastName: 'Suárez', role: 'CTO', company: 'DataMinds', phone: '+57 314 555 1111', email: 'hsuarez@dataminds.co', status: 'Prospecto', agentId: 'u1', score: 74, tags: [], city: 'Bogotá', country: 'Colombia', createdAt: '2024-05-01T09:00:00Z' },
  { id: 'c12', firstName: 'Camila', lastName: 'Restrepo', role: 'Fundadora', company: 'EduTech Latam', phone: '+57 321 555 1212', email: 'crestrepo@edutech.co', status: 'Lead', agentId: 'u2', score: 68, tags: ['Urgente'], city: 'Envigado', country: 'Colombia', createdAt: '2024-05-10T14:45:00Z' },
];

export const DEALS: Deal[] = [
  { id: 'd1', title: 'Implementación ERP', contactId: 'c1', value: 45000000, probability: 85, stage: 'Negociación', estimatedCloseDate: '2025-08-15', responsibleId: 'u1' },
  { id: 'd2', title: 'Campaña Digital Q3', contactId: 'c2', value: 12000000, probability: 60, stage: 'Propuesta enviada', estimatedCloseDate: '2025-07-30', responsibleId: 'u2' },
  { id: 'd3', title: 'Plataforma Fintech', contactId: 'c3', value: 78000000, probability: 40, stage: 'Contactado', estimatedCloseDate: '2025-09-20', responsibleId: 'u1' },
  { id: 'd4', title: 'Torre Residencial Norte', contactId: 'c4', value: 120000000, probability: 90, stage: 'Negociación', estimatedCloseDate: '2025-08-05', responsibleId: 'u3' },
  { id: 'd5', title: 'Sistema de Riego IoT', contactId: 'c5', value: 8500000, probability: 10, stage: 'Cerrado perdido', estimatedCloseDate: '2024-12-01', responsibleId: 'u2' },
  { id: 'd6', title: 'App Banca Móvil', contactId: 'c6', value: 95000000, probability: 95, stage: 'Propuesta enviada', estimatedCloseDate: '2025-08-01', responsibleId: 'u1' },
  { id: 'd7', title: 'Módulo CRM Claro', contactId: 'c7', value: 35000000, probability: 50, stage: 'Contactado', estimatedCloseDate: '2025-09-10', responsibleId: 'u3' },
  { id: 'd8', title: 'Plataforma Telemedicina', contactId: 'c8', value: 55000000, probability: 70, stage: 'Propuesta enviada', estimatedCloseDate: '2025-08-25', responsibleId: 'u2' },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: 'conv1',
    contactId: 'c1',
    channel: 'WhatsApp',
    status: 'Abierta',
    assignedTo: 'u1',
    messages: [
      { id: 'm1', sender: 'Carlos Mendoza', content: 'Buenos días Ana, quiero saber el estado de la propuesta que enviaron la semana pasada', timestamp: '2024-05-28T10:23:00Z' },
      { id: 'm2', sender: 'Ana García', content: 'Buenos días Carlos! Claro, la propuesta está siendo revisada por nuestro equipo técnico. Le confirmo hoy antes de las 3pm', timestamp: '2024-05-28T10:25:00Z' },
      { id: 'm3', sender: 'Carlos Mendoza', content: 'Perfecto, muchas gracias', timestamp: '2024-05-28T10:26:00Z' },
      { id: 'm4', sender: 'Ana García', content: 'Hablar con el equipo técnico para acelerar revisión - cliente muy importante', timestamp: '2024-05-28T10:45:00Z', isInternal: true },
      { id: 'm5', sender: 'Ana García', content: 'Carlos, acabo de hablar con el equipo. La propuesta está lista y se la envío en los próximos minutos por correo', timestamp: '2024-05-28T15:02:00Z' },
      { id: 'm6', sender: 'Carlos Mendoza', content: 'Excelente! La reviso y le doy retroalimentación mañana', timestamp: '2024-05-28T15:04:00Z' },
    ]
  },
  {
    id: 'conv2',
    contactId: 'c2',
    channel: 'Email',
    status: 'En espera',
    assignedTo: 'u2',
    messages: [
      { id: 'm7', sender: 'Laura Gómez', content: 'Hola, necesito cotización para una campaña digital de 3 meses para nuestras marcas principales', timestamp: '2024-05-26T09:10:00Z' },
      { id: 'm8', sender: 'Pedro Ruiz', content: 'Hola Laura, con gusto te ayudo. Para preparar la propuesta necesito saber: presupuesto aproximado, canales de interés y fechas de inicio', timestamp: '2024-05-26T09:45:00Z' },
    ]
  },
  {
    id: 'conv3',
    contactId: 'c6',
    channel: 'Web Chat',
    status: 'Resuelta',
    assignedTo: 'u1',
    messages: [
      { id: 'm9', sender: 'Valentina Ospina', content: 'Hola, ya firmé el contrato y lo envié de vuelta.', timestamp: '2024-05-25T11:00:00Z' },
      { id: 'm10', sender: 'Ana García', content: 'Recibido Valentina! Bienvenido oficialmente. Empezamos el onboarding mañana.', timestamp: '2024-05-25T11:15:00Z' },
    ]
  },
  { id: 'conv4', contactId: 'c8', channel: 'WhatsApp', status: 'Abierta', assignedTo: 'u2', messages: [] },
  { id: 'conv5', contactId: 'c10', channel: 'Instagram', status: 'Abierta', assignedTo: 'u3', messages: [] },
  { id: 'conv6', contactId: 'c9', channel: 'Facebook', status: 'En espera', assignedTo: 'u3', messages: [] },
];

export const TASKS: Task[] = [
  { id: 't1', title: 'Llamada de seguimiento post-propuesta', contactId: 'c1', dueDate: '2024-05-29T10:00:00Z', priority: 'Alta', assignedId: 'u1', status: 'Pendiente' },
  { id: 't2', title: 'Enviar propuesta actualizada', contactId: 'c8', dueDate: '2024-05-28T17:00:00Z', priority: 'Alta', assignedId: 'u2', status: 'Pendiente' },
  { id: 't3', title: 'Demo del producto', contactId: 'c3', dueDate: '2024-05-31T14:00:00Z', priority: 'Media', assignedId: 'u1', status: 'Pendiente' },
  { id: 't4', title: 'Revisión contrato legal', contactId: 'c4', dueDate: '2024-06-02T11:00:00Z', priority: 'Alta', assignedId: 'u3', status: 'En progreso' },
  { id: 't5', title: 'Onboarding cliente nuevo', contactId: 'c6', dueDate: '2024-06-04T09:00:00Z', priority: 'Media', assignedId: 'u1', status: 'Completada' },
  { id: 't6', title: 'Actualizar propuesta de precios', contactId: 'c2', dueDate: '2024-05-30T15:30:00Z', priority: 'Baja', assignedId: 'u2', status: 'Pendiente' },
  { id: 't7', title: 'Reunión de alineación interna', dueDate: '2024-05-28T16:00:00Z', priority: 'Media', assignedId: 'u3', status: 'Pendiente' },
  { id: 't8', title: 'Renovación contrato anual', contactId: 'c10', dueDate: '2024-06-07T10:00:00Z', priority: 'Alta', assignedId: 'u3', status: 'Pendiente' },
];
