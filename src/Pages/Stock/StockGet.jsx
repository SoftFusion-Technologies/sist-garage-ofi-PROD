import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import {
  FaWarehouse,
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaBoxOpen,
  FaMapPin,
  FaCircle,
  FaPrint,
  FaCopy,
  FaTimes,
  FaChevronDown
} from 'react-icons/fa';
import ButtonBack from '../../Components/ButtonBack.jsx';
import ParticlesBackground from '../../Components/ParticlesBackground.jsx';
import BulkUploadButton from '../../Components/BulkUploadButton.jsx';
import * as XLSX from 'xlsx';
import { useAuth } from '../../AuthContext.jsx';
import { toast, ToastContainer } from 'react-toastify';
import { ModalFeedback } from '../Ventas/Config/ModalFeedback.jsx';
import Barcode from 'react-barcode';
Modal.setAppElement('#root');

// R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
const API_BASE = import.meta.env.VITE_API_URL || 'https://vps-5192960-x.dattaweb.com';

const CATEGORIAS_TALLES = {
  calzado: [
    // TIPOS DE CALZADO
    'calzado',
    'zapatilla',
    'zapatillas',
    'zapato',
    'zapatos',
    'botín',
    'botines',
    'bota',
    'botas',
    'sandalia',
    'sandalias',
    'alpargata',
    'alpargatas',
    'pantufla',
    'pantuflas',
    'ojota',
    'ojotas',
    'crocs',
    'slipper',
    'slippers',
    'mocasín',
    'mocasines',
    'borcego',
    'borcegos',
    'nautica',
    'náutica'
  ],
  ropa: [
    // TIPOS DE ROPA
    'ropa',
    'remera',
    'remeras',
    'campera',
    'camperas',
    'camisa',
    'camisas',
    'pantalon',
    'pantalón',
    'pantalones',
    'buzo',
    'buzos',
    'jean',
    'jeans',
    'chomba',
    'chombas',
    'short',
    'shorts',
    'chaleco',
    'chalecos',
    'saco',
    'sacos',
    'musculosa',
    'musculosas',
    'sweater',
    'sweaters',
    'top',
    'tops',
    'falda',
    'faldas',
    'vestido',
    'vestidos',
    'blusa',
    'blusas',
    'pollera',
    'polleras',
    'tapado',
    'tapados',
    'camiseta',
    'camisetas',
    'bermuda',
    'bermudas',
    'anorak',
    'anoraks',
    'mameluco',
    'mamelucos',
    'enterito',
    'enteritos',
    'overol',
    'overoles',
    'body',
    'bodys',
    'leggins',
    'legging',
    'pijama',
    'pijamas'
  ],
  accesorio: [
    // ACCESORIOS
    'accesorio',
    'accesorios',
    'gorra',
    'gorras',
    'bolso',
    'bolsos',
    'riñonera',
    'riñoneras',
    'mochila',
    'mochilas',
    'cinturon',
    'cinturón',
    'cinturones',
    'cartera',
    'carteras',
    'bufanda',
    'bufandas',
    'pañuelo',
    'pañuelos',
    'guante',
    'guantes',
    'billetera',
    'billeteras',
    'correa',
    'correas',
    'paraguas',
    'sombrero',
    'sombreros',
    'corbata',
    'corbatas',
    'vincha',
    'vinchas',
    'bandolera',
    'bandoleras',
    'pasamontañas',
    'tapaboca',
    'tapabocas',
    'anteojo',
    'anteojos',
    'lentes',
    'gafas'
  ]
};

// R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
const descargarPdf = async (pathWithQuery, filename, token) => {
  const url = `${API_BASE}${
    pathWithQuery.startsWith('/') ? '' : '/'
  }${pathWithQuery}`;

  console.log(url);
  const res = await fetch(url, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('No se pudo generar/descargar el PDF');
  const blob = await res.blob();
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};
// R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅

const StockGet = () => {
  function mapCategoriaATipoTalle(nombreCategoria) {
    const cat = nombreCategoria?.toLowerCase() || '';

    for (const [tipo, palabras] of Object.entries(CATEGORIAS_TALLES)) {
      if (palabras.some((palabra) => cat.includes(palabra))) {
        return tipo;
      }
    }
    // return 'ropa';
    return null;
  }

  const { userLevel } = useAuth();
  const UMBRAL_STOCK_BAJO = 5;
  const [stock, setStock] = useState([]);
  const [formData, setFormData] = useState({
    producto_id: '',
    talle_id: '',
    local_id: '', // ← legacy: un solo local
    locales: [], // ← nuevo: varios locales
    lugar_id: '',
    estado_id: '',
    cantidad: 0,
    en_perchero: true,
    codigo_sku: ''
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTallesOpen, setModalTallesOpen] = useState(false);
  const [tallesGroupView, setTallesGroupView] = useState(null); // El grupo actual

  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');

  const [productos, setProductos] = useState([]);
  const [talles, setTalles] = useState([]);
  const [locales, setLocales] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [estados, setEstados] = useState([]);

  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25
  const [talleFiltro, setTalleFiltro] = useState('todos');
  const [localFiltro, setLocalFiltro] = useState('todos');
  const [localesFiltro, setLocalesFiltro] = useState([]); // [] = todos
  const [showLocalesFiltro, setShowLocalesFiltro] = useState(false);

  const [lugarFiltro, setLugarFiltro] = useState('todos');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [enPercheroFiltro, setEnPercheroFiltro] = useState('todos');
  const [cantidadMin, setCantidadMin] = useState('');
  const [cantidadMax, setCantidadMax] = useState('');
  const [skuFiltro, setSkuFiltro] = useState('');
  const [verSoloStockBajo, setVerSoloStockBajo] = useState(false);
  // RELACION AL FILTRADO BENJAMIN ORELLANA 23-04-25

  const [cantidadesPorTalle, setCantidadesPorTalle] = useState([]);

  const [grupoOriginal, setGrupoOriginal] = useState(null);
  const [grupoEditando, setGrupoEditando] = useState(null);
  const [grupoAEliminar, setGrupoAEliminar] = useState(null);

  const [modalFeedbackOpen, setModalFeedbackOpen] = useState(false);
  const [modalFeedbackMsg, setModalFeedbackMsg] = useState('');
  const [modalFeedbackType, setModalFeedbackType] = useState('info'); // success | error | info

  const [openConfirm, setOpenConfirm] = useState(false);

  const [skuParaImprimir, setSkuParaImprimir] = useState(null);
  const titleRef = useRef(document.title);

  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [errorImp, setErrorImp] = useState(null);
  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅
  const [dupOpen, setDupOpen] = useState(false);
  const [dupGroup, setDupGroup] = useState(null);
  const [dupNombre, setDupNombre] = useState('');
  const [dupCopiarCant, setDupCopiarCant] = useState(false); // por defecto NO copiar cantidades
  const [dupLoading, setDupLoading] = useState(false);
  // NUEVOS estados para el modal mejorado
  const [dupShowPreview, setDupShowPreview] = useState(false);
  const [dupLocalesSel, setDupLocalesSel] = useState([]); // ids de locales seleccionados
  const [dupShowLocales, setDupShowLocales] = useState(false); // dropdown de locales

  const [showLocalesPicker, setShowLocalesPicker] = useState(false);
  const [localesQuery, setLocalesQuery] = useState('');

  // límite real de DB: productos.nombre es varchar(100)
  const MAX_NOMBRE = 100;

  // helpers para preview SKU (coincide con el back)
  const slugify = (v = '') =>
    String(v)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/\((.*?)\)/g, '$1')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const buildSkuPreview = ({
    productoNombre,
    talleNombre,
    localNombre,
    lugarNombre
  }) =>
    [
      slugify(productoNombre),
      String(talleNombre || '').toUpperCase(),
      slugify(localNombre),
      slugify(lugarNombre)
    ]
      .filter(Boolean)
      .join('-')
      .replace(/-+/g, '-');

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅

  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅
  const hayImprimiblesEnGrupo = (group) =>
    Array.isArray(group?.items) &&
    group.items.some((i) => (i.cantidad ?? 0) > 0);
  // R1- que se puedan imprimir todas las etiquetas del mismo producto BENJAMIN ORELLANA 9/8/25 ✅

  const fetchAll = async () => {
    try {
      const [resStock, resProd, resTalles, resLocales, resLugares, resEstados] =
        await Promise.all([
          axios.get('https://vps-5192960-x.dattaweb.com/stock'),
          axios.get('https://vps-5192960-x.dattaweb.com/productos'),
          axios.get('https://vps-5192960-x.dattaweb.com/talles'),
          axios.get('https://vps-5192960-x.dattaweb.com/locales'),
          axios.get('https://vps-5192960-x.dattaweb.com/lugares'),
          axios.get('https://vps-5192960-x.dattaweb.com/estados')
        ]);
      setStock(resStock.data);
      setProductos(resProd.data);
      setTalles(resTalles.data);
      setLocales(resLocales.data);
      setLugares(resLugares.data);
      setEstados(resEstados.data);
    } catch (err) {
      setModalFeedbackMsg(
        'Ocurrió un error al cargar los datos.\n' +
          (process.env.NODE_ENV !== 'production'
            ? err.message || err.toString()
            : '')
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openModal = (item = null, group = null) => {
    if (item) {
      setEditId(item.id); // edición individual
      setFormData({ ...item, locales: [] }); // ⬅️ agrega locales
      setCantidadesPorTalle([]);
      setGrupoOriginal(null);
      setGrupoEditando(null);
    } else if (group) {
      setEditId(null);
      setFormData({
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        en_perchero: group.en_perchero,
        codigo_sku: '',
        locales: [] // ⬅️ agrega locales
      });
      setGrupoOriginal({
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        en_perchero: group.en_perchero
      });
      setGrupoEditando(group);
      setCantidadesPorTalle(
        group.items.map((i) => ({
          talle_id: i.talle_id,
          cantidad: i.cantidad
        }))
      );
    } else {
      setEditId(null);
      setFormData({
        producto_id: '',
        local_id: '',
        lugar_id: '',
        estado_id: '',
        en_perchero: true,
        codigo_sku: '',
        locales: [] // ⬅️ agrega locales
      });
      setCantidadesPorTalle([]);
      setGrupoOriginal(null);
      setGrupoEditando(null);
    }
    setModalOpen(true);
  };

  useEffect(() => {
    if (formData.producto_id && !editId && !grupoEditando) {
      const producto = productos.find(
        (p) => p.id === Number(formData.producto_id)
      );
      const tipoTalle = mapCategoriaATipoTalle(producto?.categoria?.nombre);

      const tallesFiltradosGroup = tipoTalle
        ? talles.filter((t) => t.tipo_categoria?.toLowerCase() === tipoTalle)
        : [];

      setCantidadesPorTalle(
        tallesFiltradosGroup.map((t) => ({
          talle_id: t.id,
          cantidad: 0
        }))
      );
    }
  }, [formData.producto_id, productos, talles, editId, grupoEditando]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ----- EDICIÓN PUNTUAL (una fila de stock) -----
    if (editId) {
      if (
        !formData.producto_id ||
        !formData.local_id ||
        !formData.lugar_id ||
        !formData.estado_id ||
        !formData.talle_id ||
        formData.cantidad == null
      ) {
        setModalFeedbackMsg('Completa todos los campos.');
        setModalFeedbackType('info');
        setModalFeedbackOpen(true);
        return;
      }

      try {
        await axios.put(`https://vps-5192960-x.dattaweb.com/stock/${editId}`, {
          ...formData,
          producto_id: Number(formData.producto_id),
          local_id: Number(formData.local_id),
          lugar_id: Number(formData.lugar_id),
          estado_id: Number(formData.estado_id),
          talle_id: Number(formData.talle_id),
          cantidad: Number(formData.cantidad)
        });
        fetchAll();
        setModalOpen(false);
        setModalFeedbackMsg('Stock actualizado correctamente.');
        setModalFeedbackType('success');
        setModalFeedbackOpen(true);
      } catch (err) {
        setModalFeedbackMsg(
          err.response?.data?.mensajeError ||
            err.response?.data?.message ||
            err.message ||
            'Error inesperado al editar el stock'
        );
        setModalFeedbackType('error');
        setModalFeedbackOpen(true);
        console.error('Error al editar stock:', err);
      }
      return;
    }

    // ----- ALTA/EDICIÓN DE GRUPO (distribuir) -----

    // Normalizar talles
    const tallesAEnviar = (cantidadesPorTalle || [])
      .filter((t) => t?.talle_id != null)
      .map((t) => ({
        talle_id: Number(t.talle_id),
        cantidad: Number(t.cantidad) || 0
      }));

    // Unificar local_id (select simple) + locales[] (multiselect)
    const localesUnicos = [
      Number(formData.local_id) || null,
      ...(Array.isArray(formData.locales)
        ? formData.locales.map((x) => Number(x))
        : [])
    ].filter(Boolean); // quita null/0/NaN
    // dedupe
    const localesDedupe = [...new Set(localesUnicos)];

    // Validación base
    if (
      !formData.producto_id ||
      !formData.lugar_id ||
      !formData.estado_id ||
      localesDedupe.length === 0
    ) {
      alert('Completa producto, lugar, estado y seleccioná al menos un local.');
      return;
    }

    // Si es edición de grupo y cambió la combinación clave => TRANSFERIR
    if (grupoOriginal) {
      const cambioGrupo =
        grupoOriginal.producto_id !== formData.producto_id ||
        grupoOriginal.local_id !== formData.local_id ||
        grupoOriginal.lugar_id !== formData.lugar_id ||
        grupoOriginal.estado_id !== formData.estado_id ||
        grupoOriginal.en_perchero !== formData.en_perchero;

      if (cambioGrupo) {
        // Transferir requiere UN destino (local_id único)
        if (!formData.local_id) {
          setModalFeedbackMsg(
            'Para transferir, elegí un único Local destino (no multiselect).'
          );
          setModalFeedbackType('info');
          setModalFeedbackOpen(true);
          return;
        }

        // Validar que los talles existan en origen
        const tallesOriginales = stock
          .filter(
            (s) =>
              s.producto_id === grupoOriginal.producto_id &&
              s.local_id === grupoOriginal.local_id &&
              s.lugar_id === grupoOriginal.lugar_id &&
              s.estado_id === grupoOriginal.estado_id
          )
          .map((s) => Number(s.talle_id));

        const tallesInvalidos = tallesAEnviar.filter(
          (t) => !tallesOriginales.includes(Number(t.talle_id))
        );

        if (tallesInvalidos.length > 0) {
          setModalFeedbackMsg(
            `No podés transferir los siguientes talles porque no existen en el local/lugar de origen:\n\n${tallesInvalidos
              .map(
                (t) =>
                  talles.find((tt) => Number(tt.id) === Number(t.talle_id))
                    ?.nombre || t.talle_id
              )
              .join(
                ', '
              )}.\n\nPara agregarlos en el destino, creá stock nuevo en vez de transferir.`
          );
          setModalFeedbackType('error');
          setModalFeedbackOpen(true);
          return;
        }

        try {
          await axios.post('https://vps-5192960-x.dattaweb.com/transferir', {
            grupoOriginal,
            nuevoGrupo: {
              producto_id: Number(formData.producto_id),
              local_id: Number(formData.local_id), // un único local
              lugar_id: Number(formData.lugar_id),
              estado_id: Number(formData.estado_id),
              en_perchero: !!formData.en_perchero
            },
            talles: tallesAEnviar
          });
          fetchAll();
          setModalOpen(false);
          setGrupoOriginal(null);
          setModalFeedbackMsg('Stock transferido correctamente.');
          setModalFeedbackType('success');
          setModalFeedbackOpen(true);
        } catch (err) {
          setModalFeedbackMsg(
            err.response?.data?.mensajeError ||
              err.response?.data?.message ||
              err.message ||
              'Error inesperado al transferir el stock'
          );
          setModalFeedbackType('error');
          setModalFeedbackOpen(true);
          console.error('Error al transferir stock:', err);
        }
        return;
      }
    }

    // DISTRIBUIR (sin cambios de grupo): SIEMPRE enviamos locales[]
    try {
      const body = {
        producto_id: Number(formData.producto_id),
        lugar_id: Number(formData.lugar_id),
        estado_id: Number(formData.estado_id),
        en_perchero: !!formData.en_perchero,
        talles: tallesAEnviar,
        reemplazar: true,
        locales: localesDedupe
      };

      if (body.locales.length === 0) {
        alert(
          'Seleccioná al menos un local (en el select o en el multiselect).'
        );
        return;
      }

      // console.log('>> POST /distribuir', body);
      await axios.post('https://vps-5192960-x.dattaweb.com/distribuir', body);

      fetchAll();
      setModalOpen(false);
      setGrupoOriginal(null);

      setModalFeedbackMsg('Stock guardado correctamente.');
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);
    } catch (err) {
      setModalFeedbackMsg(
        err.response?.data?.mensajeError ||
          err.response?.data?.message ||
          err.message ||
          'Error inesperado al guardar el stock'
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
      console.error('Error al guardar stock:', err);
    }
  };

  const handleDelete = async (id) => {
    const confirmado = window.confirm(
      '¿Estás seguro de eliminar este talle? Esta acción no se puede deshacer.'
    );
    if (!confirmado) return;

    try {
      await axios.delete(`https://vps-5192960-x.dattaweb.com/stock/${id}`);
      setTallesGroupView((prev) => ({
        ...prev,
        items: prev.items.filter((x) => x.id !== id)
      }));
      fetchAll();

      setModalFeedbackMsg('Talle eliminado correctamente.');
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);
    } catch (err) {
      setModalFeedbackMsg(
        err.response?.data?.mensajeError ||
          err.response?.data?.message ||
          err.message ||
          'Ocurrió un error al eliminar el talle. Intenta de nuevo.'
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);

      console.error('Error al eliminar stock:', err);
    }
  };

  // handler SIN parámetro, usa el estado actual
  const handleDeleteGroup = async () => {
    if (!grupoAEliminar) return;
    const nombreProducto =
      productos.find((p) => p.id === grupoAEliminar.producto_id)?.nombre || '';

    try {
      const res = await axios.post('https://vps-5192960-x.dattaweb.com/eliminar-grupo', {
        producto_id: grupoAEliminar.producto_id,
        local_id: grupoAEliminar.local_id,
        lugar_id: grupoAEliminar.lugar_id,
        estado_id: grupoAEliminar.estado_id
      });

      setModalFeedbackMsg(res.data.message || 'Stock eliminado exitosamente.');
      setModalFeedbackType('success'); // 👈🏼 Mostrá el verde éxito
      setModalFeedbackOpen(true);

      setOpenConfirm(false);
      setGrupoAEliminar(null);
      fetchAll();
    } catch (err) {
      const mensaje =
        err.response?.data?.mensajeError ||
        err.response?.data?.message ||
        err.message ||
        'Error inesperado al eliminar el stock del grupo';

      setModalFeedbackMsg(mensaje);
      setModalFeedbackType('error'); // 👈🏼 Mostrá el rojo error
      setModalFeedbackOpen(true);

      setOpenConfirm(false);
      setGrupoAEliminar(null);
    }
  };

  const filtered = stock
    .filter((item) => {
      const prod = productos.find((p) => p.id === item.producto_id);
      const nombre = (prod?.nombre || '').toLowerCase();
      const q = (search || '').toLowerCase().trim();
      return nombre.includes(q);
    })
    .filter(
      (item) =>
        talleFiltro === 'todos' ||
        item.talle_id === Number.parseInt(talleFiltro)
    )
    // ⬇️ aquí el cambio: multi-local
    .filter(
      (item) =>
        localesFiltro.length === 0 || localesFiltro.includes(item.local_id)
    )
    .filter(
      (item) =>
        lugarFiltro === 'todos' ||
        item.lugar_id === Number.parseInt(lugarFiltro)
    )
    .filter(
      (item) =>
        estadoFiltro === 'todos' ||
        item.estado_id === Number.parseInt(estadoFiltro)
    )
    .filter((item) => {
      if (enPercheroFiltro === 'todos') return true;
      return item.en_perchero === (enPercheroFiltro === 'true');
    })
    .filter((item) => {
      const min = Number.isNaN(Number.parseInt(cantidadMin))
        ? 0
        : Number.parseInt(cantidadMin);
      const max = Number.isNaN(Number.parseInt(cantidadMax))
        ? Infinity
        : Number.parseInt(cantidadMax);
      return item.cantidad >= min && item.cantidad <= max;
    })
    .filter((item) => {
      const sku = (item.codigo_sku || '').toLowerCase(); // null-safe
      const qSku = (skuFiltro || '').toLowerCase().trim();
      return sku.includes(qSku);
    })
    .filter((item) =>
      verSoloStockBajo ? item.cantidad <= UMBRAL_STOCK_BAJO : true
    );

  const exportarStockAExcel = (datos) => {
    // Mapeamos los datos que querés exportar (puede incluir joins)
    const exportData = datos.map((item) => ({
      Producto:
        productos.find((p) => p.id === item.producto_id)?.nombre ||
        'Sin nombre',
      Talle: item.talle_id || '-',
      Local: item.local_id || '-',
      Lugar: item.lugar_id || '-',
      Estado: item.estado_id || '-',
      Cantidad: item.cantidad,
      'En Perchero': item.en_perchero ? 'Sí' : 'No',
      SKU: item.codigo_sku || '',
      'Última actualización': new Date(item.updated_at).toLocaleString('es-AR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock');

    const fecha = new Date();
    const timestamp = fecha
      .toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
      .replace(/[/:]/g, '-'); // Reemplaza / y : para que sea válido en nombre de archivo

    const nombreArchivo = `stock-exportado-${timestamp}.xlsx`;

    XLSX.writeFile(workbook, nombreArchivo);
  };

  const productoSeleccionado = productos.find(
    (p) => p.id === Number(formData.producto_id)
  );

  const tipoTalle = mapCategoriaATipoTalle(
    productoSeleccionado?.categoria?.nombre
  );

  const tallesFiltrados = tipoTalle
    ? talles.filter((t) => t.tipo_categoria?.toLowerCase() === tipoTalle)
    : [];

  const stockAgrupado = [];
  filtered.forEach((item) => {
    const key = [
      item.producto_id,
      item.local_id,
      item.lugar_id,
      item.estado_id,
      item.en_perchero
    ].join('-');
    let group = stockAgrupado.find((g) => g.key === key);
    if (!group) {
      group = {
        key,
        producto_id: item.producto_id,
        local_id: item.local_id,
        lugar_id: item.lugar_id,
        estado_id: item.estado_id,
        en_perchero: item.en_perchero,
        items: []
      };
      stockAgrupado.push(group);
    }
    group.items.push(item);
  });

  const handleImprimirCodigoBarra = (item) => {
    setSkuParaImprimir(item);
  };

  const handlePrint = () => {
    titleRef.current = document.title;
    document.title = skuParaImprimir.codigo_sku || 'Etiqueta';
    window.print();
    setTimeout(() => {
      document.title = titleRef.current;
      setSkuParaImprimir(null);
    }, 1000);
  };

  const handleClose = () => {
    document.title = titleRef.current;
    setSkuParaImprimir(null);
  };

  useEffect(() => {
    return () => {
      document.title = titleRef.current;
    };
  }, []);

  const imprimirGrupo = async (group) => {
    if (!hayImprimiblesEnGrupo(group)) {
      setModalFeedbackMsg(
        'Este grupo no tiene stock disponible para imprimir.'
      );
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    try {
      setDescargandoPdf(true);

      const producto = productos.find((p) => p.id === group.producto_id);
      const nombreProd = producto?.nombre || 'producto';

      const safeNombre = nombreProd
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '_');

      // Fecha en formato dd-mm-aaaa
      const fechaObj = new Date();
      const fecha = [
        String(fechaObj.getDate()).padStart(2, '0'),
        String(fechaObj.getMonth() + 1).padStart(2, '0'),
        fechaObj.getFullYear()
      ].join('-');

      const qs = new URLSearchParams({
        mode: 'group',
        producto_id: group.producto_id,
        local_id: group.local_id,
        lugar_id: group.lugar_id,
        estado_id: group.estado_id,
        minQty: '1',
        copies: '1',
        layout: 'a4'
      }).toString();

      await descargarPdf(
        `/stock/labels.pdf?${qs}`,
        `${safeNombre}_${fecha}.pdf`
      );
    } catch (e) {
      setModalFeedbackMsg('No se pudo generar el PDF del grupo.');
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    } finally {
      setDescargandoPdf(false);
    }
  };

  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅
  const abrirDuplicar = (group) => {
    setDupGroup(group);
    // buscar el nombre real del producto
    const prod = productos.find((p) => p.id === group.producto_id);
    const nombreBase = prod?.nombre || 'Producto';
    setDupNombre(`${nombreBase} (copia)`);
    setDupCopiarCant(false);
    setDupOpen(true);
  };

  const duplicarProducto = async () => {
    if (!dupGroup) return;

    const prodId = dupGroup.producto_id;
    if (!dupNombre?.trim()) {
      setModalFeedbackMsg('Ingresá un nombre nuevo para el producto.');
      setModalFeedbackType('info');
      setModalFeedbackOpen(true);
      return;
    }

    try {
      setDupLoading(true);
      const body = {
        nuevoNombre: dupNombre.trim(),
        duplicarStock: true, // Duplicar estructura de stock
        copiarCantidad: dupCopiarCant // false por defecto (recomendado)
        // locales: [1,2,3]              // Para Req 3 (opcional)
      };

      const { data } = await axios.post(
        `https://vps-5192960-x.dattaweb.com/productos/${prodId}/duplicar`,
        body
      );

      // feedback + refrescar listas
      setModalFeedbackMsg(
        `Producto duplicado. Nuevo ID: ${data.nuevo_producto_id}`
      );
      setModalFeedbackType('success');
      setModalFeedbackOpen(true);

      setDupOpen(false);
      await fetchAll(); // ya lo tenés implementado
    } catch (e) {
      setModalFeedbackMsg(
        `No se pudo duplicar el producto. ${
          e?.response?.data?.mensajeError || e.message
        }`
      );
      setModalFeedbackType('error');
      setModalFeedbackOpen(true);
    } finally {
      setDupLoading(false);
    }
  };
  // R2 - permitir duplicar productos, para poder cambiar nombres BENJAMIN ORELLANA 9/8/25 ✅

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-6 text-white">
      <ParticlesBackground />
      <ButtonBack />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-cyan-300 flex items-center gap-2 uppercase">
            <FaWarehouse /> Stock
          </h1>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <BulkUploadButton
              tabla="stock"
              onSuccess={() => fetchAll()} // función para recargar stock después de importar
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            />
            <button
              onClick={() => exportarStockAExcel(filtered)}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
            >
              <FaDownload /> Exportar Excel
            </button>

            <button
              onClick={() => openModal()}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            >
              <FaPlus /> Nuevo
            </button>
          </div>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {/* Filtro por Talle */}
          <select
            value={talleFiltro}
            onChange={(e) => setTalleFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los talles</option>
            {talles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Local */}
          <select
            value={localFiltro}
            onChange={(e) => setLocalFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los locales</option>
            {locales.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Lugar */}
          <select
            value={lugarFiltro}
            onChange={(e) => setLugarFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los lugares</option>
            {lugares.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por Estado */}
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos los estados</option>
            {estados.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>

          {/* Filtro por perchero */}
          <select
            value={enPercheroFiltro}
            onChange={(e) => setEnPercheroFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          >
            <option value="todos">Todos</option>
            <option value="true">En perchero</option>
            <option value="false">No en perchero</option>
          </select>

          {/* Filtro por cantidad */}
          <input
            type="number"
            placeholder="Cantidad mínima"
            value={cantidadMin}
            onChange={(e) => setCantidadMin(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
          <input
            type="number"
            placeholder="Cantidad máxima"
            value={cantidadMax}
            onChange={(e) => setCantidadMax(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />

          {/* Filtro por SKU */}
          <input
            type="text"
            placeholder="Buscar por SKU"
            value={skuFiltro}
            onChange={(e) => setSkuFiltro(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
        </div>

        <button
          onClick={() => setVerSoloStockBajo((prev) => !prev)}
          className={`px-4 mb-2 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
            verSoloStockBajo
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-800 text-white'
          }`}
        >
          {verSoloStockBajo ? 'Ver Todos' : 'Mostrar Stock Bajo'}
        </button>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {stockAgrupado.map((group, idx) => {
            const producto = productos.find((p) => p.id === group.producto_id);
            const local = locales.find((l) => l.id === group.local_id);
            const lugar = lugares.find((l) => l.id === group.lugar_id);
            const estado = estados.find((e) => e.id === group.estado_id);
            const cantidadTotal = group.items.reduce(
              (sum, i) => sum + i.cantidad,
              0
            );

            // locales (además del actual) donde este producto tiene stock > 0
            const otrosLocalesConStock = (() => {
              const tot = new Map(); // local_id -> total
              for (const s of stock) {
                if (s.producto_id === group.producto_id) {
                  tot.set(
                    s.local_id,
                    (tot.get(s.local_id) || 0) + (Number(s.cantidad) || 0)
                  );
                }
              }
              const idsConStock = [...tot.entries()]
                .filter(([, q]) => q > 0)
                .map(([id]) => id);

              // mapeamos a objetos de "locales", excluyendo el local actual del grupo
              return locales.filter(
                (l) => idsConStock.includes(l.id) && l.id !== group.local_id
              );
            })();

            return (
              <motion.div
                key={group.key}
                layout
                className="bg-white/10 p-6 rounded-2xl shadow-md border border-white/10 hover:scale-[1.02]"
              >
                <h2 className="text-xl font-bold text-cyan-300 mb-1 uppercase">
                  {producto?.nombre}
                </h2>
                <p className="text-sm">ID: {producto?.id}</p>
                <p className="text-sm">Local: {local?.nombre}</p>

                {otrosLocalesConStock.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-white/70">También en:</span>
                    {otrosLocalesConStock.map((l) => (
                      <span
                        key={l.id}
                        className="px-2 py-1 rounded-full bg-white/10 border border-white/10"
                      >
                        {l.nombre}
                      </span>
                    ))}
                  </div>
                )}

                <p className="text-sm">Lugar: {lugar?.nombre || 'Sin lugar'}</p>
                <p className="text-sm">
                  Estado: {estado?.nombre || 'Sin Estado'}
                </p>
                <p className="text-sm flex items-center gap-2">
                  <span
                    className={
                      cantidadTotal <= UMBRAL_STOCK_BAJO
                        ? 'text-red-400'
                        : 'text-green-300'
                    }
                  >
                    Cantidad total: {cantidadTotal}
                  </span>
                  {cantidadTotal <= UMBRAL_STOCK_BAJO && (
                    <span className="flex items-center text-red-500 font-bold text-xs animate-pulse">
                      <FaExclamationTriangle className="mr-1" />
                      ¡Stock bajo!
                    </span>
                  )}
                </p>
                <p className="text-sm flex items-center gap-2">
                  En perchero:
                  {group.en_perchero ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <FaCheckCircle /> Sí
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1">
                      <FaTimesCircle /> No
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTallesGroupView(group);
                      setModalTallesOpen(true);
                    }}
                    className="mt-2 mb-2 px-3 py-1 bg-cyan-700 rounded-lg text-white text-sm font-semibold"
                  >
                    Ver talles y SKU
                  </button>

                  {/* Botón Imprimir SKU por grupo */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!hayImprimiblesEnGrupo(group)) {
                        setModalFeedbackMsg(
                          'Este grupo no tiene stock disponible para imprimir.'
                        );
                        setModalFeedbackType('info');
                        setModalFeedbackOpen(true);
                        return;
                      }
                      imprimirGrupo(group);
                    }}
                    disabled={descargandoPdf || !hayImprimiblesEnGrupo(group)}
                    className={`mt-2 mb-2 px-3 py-1 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60
    ${
      hayImprimiblesEnGrupo(group)
        ? 'bg-purple-600 hover:bg-purple-500'
        : 'bg-white/20 cursor-not-allowed'
    }`}
                    title={
                      hayImprimiblesEnGrupo(group)
                        ? 'Imprimir SKUs del grupo'
                        : 'Sin stock para imprimir'
                    }
                  >
                    <FaPrint className="text-purple-300" />
                    {descargandoPdf ? 'Generando…' : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirDuplicar(group)}
                    className="mt-2 mb-2 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                    title="Duplicar producto"
                  >
                    <FaCopy className="text-blue-200" />
                  </button>

                  {errorImp && (
                    <div className="mt-2 text-sm text-red-300">{errorImp}</div>
                  )}

                  {userLevel === 'admin' && (
                    <>
                      <button
                        onClick={() => {
                          openModal(null, group); // null para item, group como segundo argumento
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          setGrupoAEliminar(group);
                          setOpenConfirm(true);
                        }}
                        className="mt-2 mb-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className={`bg-white rounded-2xl p-8 shadow-2xl border-l-4 border-cyan-500
    ${formData.producto_id ? 'max-w-2xl' : 'max-w-lg'} w-full mx-4`}
        >
          <h2 className="text-2xl font-bold mb-4 text-cyan-600">
            {editId ? 'Editar Stock' : 'Nuevo Stock'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            {[
              { label: 'Producto', name: 'producto_id', options: productos },
              ...(editId
                ? [{ label: 'Talle', name: 'talle_id', options: talles }]
                : []),
              { label: 'Local', name: 'local_id', options: locales },
              { label: 'Lugar', name: 'lugar_id', options: lugares },
              { label: 'Estado', name: 'estado_id', options: estados }
            ].map(({ label, name, options }) => (
              <div key={name}>
                <label className="block font-semibold mb-1">{label}</label>
                <select
                  value={formData[name]}
                  onChange={(e) =>
                    setFormData({ ...formData, [name]: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  // 🔸 si eligen locales múltiples, el select de "Local" deja de ser requerido
                  required={
                    name === 'local_id' ? !(formData.locales?.length > 0) : true
                  }
                >
                  <option value="">Seleccione {label}</option>
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {/* 🔹 NUEVO: selección múltiple de locales (solo en alta/edición de grupo) */}
            {!editId && (
              <div className="relative">
                <label className="block font-semibold mb-1">
                  Locales (múltiple)
                </label>

                {/* Botón que abre el picker */}
                <button
                  type="button"
                  onClick={() => setShowLocalesPicker((v) => !v)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white flex items-center justify-between"
                >
                  <span className="text-left truncate">
                    {formData.locales?.length
                      ? `Seleccionados: ${formData.locales.length}`
                      : 'Seleccionar uno o más…'}
                  </span>
                  {/* <FaChevronDown className="opacity-60" /> */}
                </button>

                {/* Chips de selección actual */}
                {formData.locales?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.locales
                      .map((id) => locales.find((l) => l.id === id))
                      .filter(Boolean)
                      .map((l) => (
                        <span
                          key={l.id}
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs"
                        >
                          {l.nombre}
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((fd) => ({
                                ...fd,
                                locales: fd.locales.filter((x) => x !== l.id)
                              }))
                            }
                            className="hover:text-cyan-900"
                            title="Quitar"
                          >
                            {/* <FaTimes /> */}×
                          </button>
                        </span>
                      ))}
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((fd) => ({ ...fd, locales: [] }))
                      }
                      className="text-xs text-gray-600 underline"
                    >
                      Limpiar
                    </button>
                  </div>
                )}

                {/* Popover */}
                {showLocalesPicker && (
                  <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-xl shadow-xl p-2">
                    {/* Buscador + acciones rápidas */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 relative">
                        {/* <FaSearch className="absolute left-2 top-2.5 text-gray-400" /> */}
                        <input
                          type="text"
                          value={localesQuery}
                          onChange={(e) => setLocalesQuery(e.target.value)}
                          placeholder="Buscar local…"
                          className="w-full pl-3 pr-3 py-2 rounded-lg border border-gray-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((fd) => ({
                            ...fd,
                            locales: locales
                              .filter((l) =>
                                l.nombre
                                  .toLowerCase()
                                  .includes(localesQuery.toLowerCase())
                              )
                              .map((l) => l.id)
                          }))
                        }
                        className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                        title="Seleccionar todos (filtrados)"
                      >
                        Seleccionar todos
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((fd) => ({ ...fd, locales: [] }))
                        }
                        className="text-xs px-2 py-1 rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Limpiar
                      </button>
                    </div>

                    {/* Lista con checkboxes */}
                    <div className="space-y-1">
                      {locales
                        .filter((l) =>
                          l.nombre
                            .toLowerCase()
                            .includes(localesQuery.toLowerCase())
                        )
                        .map((l) => {
                          const checked = formData.locales.includes(l.id);
                          return (
                            <label
                              key={l.id}
                              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={(e) => {
                                  setFormData((fd) => ({
                                    ...fd,
                                    locales: e.target.checked
                                      ? [...new Set([...fd.locales, l.id])]
                                      : fd.locales.filter((id) => id !== l.id)
                                  }));
                                }}
                              />
                              <span className="text-sm">{l.nombre}</span>
                              {checked && (
                                <span className="ml-auto text-xs text-cyan-700">
                                  ✓
                                </span>
                              )}
                            </label>
                          );
                        })}
                    </div>

                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLocalesPicker(false)}
                        className="px-3 py-1 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLocalesPicker(false)}
                        className="px-3 py-1 text-sm rounded-md bg-cyan-600 text-white hover:bg-cyan-500"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Si seleccionás al menos un local acá, ignoramos el campo
                  “Local” de arriba.
                </p>
              </div>
            )}
            {editId && (
              <div>
                <label className="block text-sm font-semibold text-gray-600">
                  Código SKU (Generado automáticamente)
                </label>
                <input
                  type="text"
                  value={formData.codigo_sku || ''}
                  readOnly
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 border border-gray-300 text-gray-600 cursor-not-allowed"
                />
              </div>
            )}

            {formData.producto_id && !editId && (
              <div>
                {tallesFiltrados.length > 0 && (
                  <label className="block font-semibold mb-3 text-gray-700 text-lg">
                    Asignar stock por talle
                  </label>
                )}

                {tallesFiltrados.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-2" style={{ minWidth: 340 }}>
                      {tallesFiltrados.map((t) => {
                        const idx = cantidadesPorTalle.findIndex(
                          (tt) => tt.talle_id === t.id
                        );
                        const cantidad =
                          idx !== -1 ? cantidadesPorTalle[idx].cantidad : 0;
                        return (
                          <div
                            key={t.id}
                            className="bg-white rounded-2xl shadow p-3 flex flex-col items-center border-2 border-gray-100 hover:border-cyan-400 transition-all min-w-[110px]"
                          >
                            <span className="text-cyan-600 font-bold text-lg mb-1">
                              {t.nombre}
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={cantidad}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCantidadesPorTalle((prev) => {
                                  const next = [...prev];
                                  const exist = next.findIndex(
                                    (tt) => tt.talle_id === t.id
                                  );
                                  if (exist !== -1) next[exist].cantidad = val;
                                  else
                                    next.push({
                                      talle_id: t.id,
                                      cantidad: val
                                    });
                                  return next;
                                });
                              }}
                              className="w-16 p-2 rounded-xl border-2 border-gray-200 focus:border-cyan-500 text-center text-base font-semibold bg-gray-50 focus:bg-white transition"
                              placeholder="0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="block font-semibold mb-1">Talle</label>
                    <select
                      value={formData.talle_id}
                      onChange={(e) =>
                        setFormData({ ...formData, talle_id: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300"
                      required
                    >
                      <option value="">Seleccione Talle</option>
                      {talles.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {editId && (
              <div className="mb-4">
                <label className="block font-semibold mb-2 text-gray-700">
                  Editar cantidad para talle:
                  <span className="text-cyan-600 ml-2 font-bold">
                    {talles.find((t) => t.id === Number(formData.talle_id))
                      ?.nombre || '-'}
                  </span>
                </label>

                <input
                  type="number"
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidad: Number(e.target.value)
                    })
                  }
                  className="w-24 p-2 rounded-xl border-2 border-gray-200 focus:border-cyan-500 text-center text-base font-semibold bg-gray-50 focus:bg-white transition"
                  placeholder="Cantidad"
                  autoFocus
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.en_perchero}
                onChange={(e) =>
                  setFormData({ ...formData, en_perchero: e.target.checked })
                }
              />
              <label>En perchero</label>
            </div>

            <div className="text-right">
              <button
                type="submit"
                className="bg-cyan-500 hover:bg-cyan-600 transition px-6 py-2 text-white font-medium rounded-lg"
              >
                {editId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>

        {/* MODAL QUE SE ABRE AL PRESIONAR VER TALLES */}
        <Modal
          isOpen={modalTallesOpen}
          onRequestClose={() => setModalTallesOpen(false)}
          overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50"
          className={`
    bg-white rounded-2xl shadow-2xl border-l-4 border-cyan-500
    w-full max-w-[98vw] sm:max-w-2xl mx-2
    max-h-[90vh] overflow-y-auto
    p-2 sm:p-6
  `}
        >
          <h2 className="text-lg sm:text-2xl font-bold mb-4 text-cyan-600 flex items-center gap-2">
            <FaWarehouse className="text-cyan-400" />
            Detalle de talles
          </h2>
          <div className="mb-2 text-gray-800 font-semibold flex flex-wrap gap-y-1 gap-x-2 text-xs sm:text-base">
            {(() => {
              const producto = productos.find(
                (p) => p.id === tallesGroupView?.producto_id
              );
              const local = locales.find(
                (l) => l.id === tallesGroupView?.local_id
              );
              const lugar = lugares.find(
                (l) => l.id === tallesGroupView?.lugar_id
              );
              const estado = estados.find(
                (e) => e.id === tallesGroupView?.estado_id
              );
              return (
                <>
                  <span className="px-3 py-1 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaBoxOpen className="text-cyan-400" />{' '}
                    <b>{producto?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-green-50 text-green-800 border border-green-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaMapPin className="text-green-400" />{' '}
                    <b>{local?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-yellow-50 text-yellow-700 border border-yellow-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaWarehouse className="text-yellow-400" />{' '}
                    <b>{lugar?.nombre}</b>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 shadow text-xs sm:text-sm flex items-center gap-1">
                    <FaCircle className="text-violet-400" />{' '}
                    <b>{estado?.nombre}</b>
                  </span>
                </>
              );
            })()}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
      grid gap-3
      grid-cols-1
      sm:grid-cols-2
      md:grid-cols-3
    `}
          >
            {tallesGroupView?.items.map((item) => {
              const nombreTalle = talles.find(
                (t) => t.id === item.talle_id
              )?.nombre;
              const isStockLow = item.cantidad <= UMBRAL_STOCK_BAJO;
              return (
                <motion.div
                  key={item.id}
                  layout
                  className={`
            relative bg-gradient-to-br from-cyan-50 via-white to-cyan-100 
            rounded-2xl shadow-xl border-l-4
            p-3 sm:p-4 flex flex-col gap-1
            ${isStockLow ? 'border-red-400' : 'border-cyan-400'}
            min-w-0 w-full
          `}
                  whileHover={{
                    scale: 1.03,
                    boxShadow: '0 4px 24px 0 rgba(0,255,255,0.18)'
                  }}
                >
                  <span
                    className={`
    inline-block px-2 py-1 rounded-xl font-bold text-base sm:text-lg shadow
    ${isStockLow ? 'bg-red-400 text-white' : 'bg-cyan-400 text-white'}
    truncate max-w-[60px]
    sm:max-w-none sm:overflow-visible sm:whitespace-normal sm:text-clip
  `}
                    title={nombreTalle}
                  >
                    <span className="hidden md:inline">TALLE: </span>
                    {nombreTalle}
                  </span>

                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <span
                      className="
    ml-auto
    text-xs sm:text-sm text-cyan-800 font-semibold bg-cyan-100
    px-2 py-0.5 rounded-lg
    max-w-full
    break-words
    whitespace-normal
    font-mono
  "
                      title={item.codigo_sku}
                    >
                      SKU: {item.codigo_sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 mb-2">
                    <span className="font-semibold text-gray-700 text-xs sm:text-md">
                      Cantidad:
                    </span>
                    <span
                      className={`
                font-bold text-base sm:text-lg 
                ${isStockLow ? 'text-red-500' : 'text-cyan-600'}
              `}
                    >
                      {item.cantidad}
                    </span>
                    {isStockLow && (
                      <span className="ml-2 flex items-center gap-1 bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-lg text-xs animate-pulse shadow">
                        <FaExclamationTriangle className="inline" /> ¡Stock
                        bajo!
                      </span>
                    )}
                  </div>
                  {userLevel === 'admin' && (
                    <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:gap-2">
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-1 bg-yellow-400 hover:bg-yellow-300 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow transition"
                        onClick={() => {
                          setModalTallesOpen(false);
                          openModal(item);
                        }}
                        title="Editar este talle"
                      >
                        <FaEdit className="inline" />
                      </button>
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-1 bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow transition"
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar este talle"
                      >
                        <FaTrash className="inline" />
                      </button>
                      <button
                        className="w-full sm:w-auto flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-semibold shadow transition"
                        onClick={() => handleImprimirCodigoBarra(item)}
                        title="Imprimir código de barras"
                      >
                        <FaPrint className="inline" />
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <div className="text-right mt-4">
            <button
              onClick={() => setModalTallesOpen(false)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-semibold"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      </div>
      {/* <ModalError
        open={modalErrorOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
      /> */}
      {/* Modal simple */}
      {openConfirm && grupoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#232b32] rounded-2xl shadow-2xl p-8 w-[90vw] max-w-sm flex flex-col gap-4 border border-gray-800 animate-fade-in">
            <div className="flex items-center gap-2 text-xl font-bold text-[#32d8fd]">
              <FaExclamationTriangle className="text-yellow-400 text-2xl" />
              Eliminar de stock
            </div>
            <div className="text-base text-gray-200">
              ¿Seguro que deseas eliminar TODO el stock del producto{' '}
              <span className="font-bold text-pink-400">
                "
                {productos.find((p) => p.id === grupoAEliminar.producto_id)
                  ?.nombre || ''}
                "
              </span>
              ?
            </div>
            <div className="text-xs text-gray-400 mb-3">
              Esta acción no puede deshacerse.
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleDeleteGroup}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow"
              >
                Eliminar
              </button>

              <button
                onClick={() => {
                  setOpenConfirm(false);
                  setGrupoAEliminar(null);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-bold shadow"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!skuParaImprimir}
        onRequestClose={() => setSkuParaImprimir(null)}
        overlayClassName="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
      >
        <h3 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
          <FaPrint className="text-green-400" /> Imprimir código de barras
        </h3>
        {skuParaImprimir && (
          <div className="flex flex-col items-center gap-4">
            {/* Nombre y talle */}
            <div className="font-semibold text-base text-black">
              {skuParaImprimir.producto?.nombre}
            </div>
            <div className="text-sm text-gray-600">
              TALLE:{skuParaImprimir.talle?.nombre}
            </div>

            {/* Código de barras */}
            <div
              className="barcode-etiqueta"
              style={{
                width: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}
            >
              <Barcode
                value={skuParaImprimir.codigo_sku}
                format="CODE128"
                width={2}
                height={60}
                displayValue={false} // <-- Oculta el texto cortado
                margin={0}
              />
              {/* Texto SKU completo, centrado y sin cortes */}
              <div
                style={{
                  fontSize: 13,
                  marginTop: 4,
                  fontWeight: 700,
                  textAlign: 'center',
                  wordBreak: 'break-all',
                  maxWidth: '95%'
                }}
              >
                {skuParaImprimir.codigo_sku}
              </div>
            </div>

            {/* Botón imprimir */}
            <button
              onClick={handlePrint}
              className="mt-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow"
            >
              Imprimir
            </button>

            <button
              onClick={handleClose}
              className="mt-2 px-5 py-1 rounded-full border border-green-300 text-green-700 font-semibold bg-white hover:bg-green-50 hover:border-green-400 transition-all text-sm shadow-sm"
            >
              Cerrar
            </button>
          </div>
        )}
      </Modal>

      {dupOpen && (
        <div
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setDupOpen(false);
            if (
              e.key === 'Enter' &&
              dupNombre.trim() &&
              dupNombre.trim().length <= MAX_NOMBRE &&
              !dupLoading
            )
              duplicarProducto();
          }}
        >
          <div className="w-full max-w-2xl bg-zinc-900/95 text-white rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-start justify-between border-b border-white/10">
              <div className="space-y-1">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FaCopy className="text-blue-300" /> Duplicar producto
                </h3>
                <p className="text-xs text-white/70">
                  Producto ID {dupGroup?.producto_id}
                </p>
                {!!productos?.length && (
                  <p className="text-sm text-white/80">
                    {productos.find((p) => p.id === dupGroup?.producto_id)
                      ?.nombre ?? '—'}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDupOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Resumen pills */}
              {(() => {
                const items = dupGroup?.items || [];
                const totalCombos = items.length;
                const totalQty = items.reduce(
                  (a, i) => a + (i.cantidad ?? 0),
                  0
                );
                const localName =
                  locales.find((l) => l.id === dupGroup?.local_id)?.nombre ??
                  `Local ${dupGroup?.local_id}`;
                const lugarName =
                  lugares.find((l) => l.id === dupGroup?.lugar_id)?.nombre ??
                  `Lugar ${dupGroup?.lugar_id}`;
                const estadoName =
                  estados.find((e) => e.id === dupGroup?.estado_id)?.nombre ??
                  `Estado ${dupGroup?.estado_id}`;

                return (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Talles: <b>{totalCombos}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Stock total: <b>{totalQty}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Local: <b>{localName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Lugar: <b>{lugarName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      Estado: <b>{estadoName}</b>
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">
                      {dupCopiarCant ? 'Copiando stock' : 'Cantidades = 0'}
                    </span>
                  </div>
                );
              })()}

              {/* Nombre + validación y contador */}
              {(() => {
                const nameExists = productos.some(
                  (p) =>
                    p.id !== dupGroup?.producto_id &&
                    (p.nombre || '').trim().toLowerCase() ===
                      dupNombre.trim().toLowerCase()
                );
                const tooLong = dupNombre.trim().length > MAX_NOMBRE;
                const invalid = !dupNombre.trim() || tooLong;

                // guardamos la condición para el botón
                window.__dupInvalid = invalid;

                return (
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold">
                        Nuevo nombre
                      </label>
                      <span
                        className={`text-xs ${
                          tooLong ? 'text-red-300' : 'text-white/50'
                        }`}
                      >
                        {dupNombre.trim().length}/{MAX_NOMBRE}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={dupNombre}
                        onChange={(e) => setDupNombre(e.target.value)}
                        autoFocus
                        className={`mt-1 w-full rounded-xl bg-white/5 border px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2
                    ${
                      invalid
                        ? 'border-red-400 focus:ring-red-500'
                        : 'border-white/10 focus:ring-purple-500'
                    }`}
                        placeholder="Ingresá el nuevo nombre…"
                      />
                      {!!dupNombre && (
                        <button
                          type="button"
                          onClick={() => setDupNombre('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                          aria-label="Limpiar"
                        >
                          <FaTimes />
                        </button>
                      )}
                    </div>
                    <div className="mt-1 text-xs">
                      <p className="text-white/60">
                        Se copiará la <b>estructura de stock</b> del producto
                        original.
                      </p>
                      {nameExists && (
                        <p className="text-yellow-300 mt-1">
                          Ya existe otro producto con este nombre. Podés
                          continuar, pero conviene diferenciarlo.
                        </p>
                      )}
                      {tooLong && (
                        <p className="text-red-300 mt-1">
                          Máximo {MAX_NOMBRE} caracteres.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Opciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="flex items-center gap-2">
                  <input
                    id="chk-copiar-cant"
                    type="checkbox"
                    checked={dupCopiarCant}
                    onChange={(e) => setDupCopiarCant(e.target.checked)}
                    className="h-4 w-4 accent-purple-600"
                  />
                  <span className="text-sm">Copiar stock</span>
                </label>

                {/* Dropdown de Locales (Req 3 listo) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDupShowLocales((v) => !v)}
                    className="w-full text-left text-sm text-white/90 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2"
                  >
                    <span>
                      {dupLocalesSel.length === 0
                        ? 'Todos los locales'
                        : `Locales seleccionados: ${dupLocalesSel.length}`}
                    </span>
                    <span className="text-white/60">
                      {dupShowLocales ? '▲' : '▼'}
                    </span>
                  </button>
                  {dupShowLocales && (
                    <div className="absolute mt-2 w-full bg-zinc-900/95 border border-white/10 rounded-xl shadow-xl z-[130] p-2 max-h-56 overflow-auto">
                      <div className="flex items-center justify-between px-2 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            setDupLocalesSel(locales.map((l) => l.id))
                          }
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Seleccionar todos
                        </button>
                        <button
                          type="button"
                          onClick={() => setDupLocalesSel([])}
                          className="text-xs text-blue-300 hover:underline"
                        >
                          Limpiar
                        </button>
                      </div>
                      {locales.map((l) => {
                        const checked = dupLocalesSel.includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-purple-600"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...dupLocalesSel, l.id]
                                  : dupLocalesSel.filter((id) => id !== l.id);
                                setDupLocalesSel(next);
                              }}
                            />
                            <span className="text-sm">{l.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview SKU (ejemplo con 1er talle del grupo) */}
              {(() => {
                const it = dupGroup?.items?.[0];
                if (!it) return null;
                const talleName =
                  it?.talle?.nombre ??
                  talles.find((t) => t.id === it.talle_id)?.nombre;
                const localName = locales.find(
                  (l) => l.id === dupGroup?.local_id
                )?.nombre;
                const lugarName = lugares.find(
                  (g) => g.id === dupGroup?.lugar_id
                )?.nombre;
                const exampleSku = buildSkuPreview({
                  productoNombre:
                    dupNombre ||
                    productos.find((p) => p.id === dupGroup?.producto_id)
                      ?.nombre ||
                    '',
                  talleNombre: talleName,
                  localNombre: localName,
                  lugarNombre: lugarName
                });
                return (
                  <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <span className="text-white/90 font-semibold">
                      Preview SKU:
                    </span>{' '}
                    {exampleSku}
                  </div>
                );
              })()}

              {/* Detalle de talles plegable */}
              <button
                type="button"
                onClick={() => setDupShowPreview((v) => !v)}
                className="w-full text-left text-sm text-white/80 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2"
              >
                <span>Ver detalle de talles</span>
                <span className="text-white/60">
                  {dupShowPreview ? '▲' : '▼'}
                </span>
              </button>
              {dupShowPreview && (
                <div className="max-h-56 overflow-auto rounded-xl border border-white/10">
                  <table className="w-full text-sm">
                    <thead className="bg-white/5 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">Talle</th>
                        <th className="text-right px-3 py-2">
                          Cantidad origen
                        </th>
                        <th className="text-right px-3 py-2">
                          Cantidad destino
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dupGroup?.items?.map((it) => (
                        <tr key={it.id} className="border-t border-white/10">
                          <td className="px-3 py-2">
                            {it.talle?.nombre ?? it.talle_id}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {it.cantidad ?? 0}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {dupCopiarCant ? it.cantidad ?? 0 : 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setDupOpen(false)}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => duplicarProducto(dupLocalesSel)}
                disabled={
                  dupLoading ||
                  !dupNombre.trim() ||
                  dupNombre.trim().length > MAX_NOMBRE
                }
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                title={
                  !dupNombre.trim()
                    ? 'Ingresá un nombre'
                    : dupNombre.trim().length > MAX_NOMBRE
                    ? `Máximo ${MAX_NOMBRE} caracteres`
                    : ''
                }
              >
                {dupLoading ? 'Duplicando…' : 'Duplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalFeedback
        open={modalFeedbackOpen}
        onClose={() => setModalFeedbackOpen(false)}
        msg={modalFeedbackMsg}
        type={modalFeedbackType}
      />

      <ToastContainer />
    </div>
  );
};

export default StockGet;
