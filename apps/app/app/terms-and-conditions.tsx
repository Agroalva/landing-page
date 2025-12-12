import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const TERMS_AND_CONDITIONS = `AGROALVA 


I.- Términos y Condiciones


El presente documento detalla los términos y condiciones (en adelante, los "Términos y Condiciones"), aplicables al acceso y uso los servicios ofrecidos dentro del sitio web www.agroalva.com.ar (en adelante, el "Sitio"), los cuales deberán ser leídos, comprendidos y aceptados por cualquier persona humana y/o jurídica que desee usar los servicios del Sitio (en adelante, el "Usuario" o "Usuarios" de forma indistinta).
El Sitio se reserva el derecho de modificar los Términos y Condiciones en cualquier momento, mediante la publicación, de los cambios introducidos en el Sitio siendo el Usuario el único responsable de revisar periódicamente los Términos y Condiciones.


II.- Descripción


El Sitio brinda un motor de búsqueda de información para ayudar a terceras personas a adquirir productos y/o contratar servicios ofertados por los Usuarios (en adelante, los "Terceros Contratantes"). El Sitio le brinda al Usuario la posibilidad de ofertar sus productos y/o servicios para que las personas que accedan puedan contactar directamente con el Usuario a los datos que de contacto que éste proporciona, y así los Terceros Contratantes contraten de forma directa con el Usuario, resultando el Sitio totalmente ajeno a la contratación de aquellas partes celebren. El propósito del servicio es únicamente de publicitar la oferta de productos y/o servicios.


III.- Autorización


Los Usuarios aceptan los Términos y Condiciones, los cuales tienen carácter de obligatorio y vinculantes, desde el momento que se registran en el Sitio. La persona que no acepte los Términos y Condiciones, deberá abstenerse de utilizar los servicios del Sitio.
IV.- Capacidad


Podrán usar los Servicios del Sitio las personas mayores de edad que tengan capacidad legal para contratar. Quien utilice el Sitio en representación de una persona jurídica, deberá tener capacidad para contratar a nombre de ella. Además, para poder usar la cuenta, el Usuario debe encontrarse activo. No podrán ser Usuarios quienes se encuentren suspendidos o inhabilitados para la utilización de los servicios prestados en el Sitio, quien se reserva el derecho de suspender y/o inhabilitar las cuentas de usuarios por las causales establecidas en los Términos y Condiciones.


V.- Registro de la Cuenta


La persona que quiera usar los servicios del Sitio, deberá completar el formulario de registro con los datos que le sean requeridos (en adelante, la "Cuenta"). Al completarlo, se compromete a realizarlo de manera exacta, precisa, vigente y verdadera, comprometiéndose a mantenerla debidamente actualizada. El Usuario será el único responsable de la certeza de sus datos de registro de la Cuenta. Sin perjuicio de la información brindada en el formulario, el Sitio se reserva la potestad de solicitar y/o consultar información adicional para verificar la identidad del Usuario, en caso que así lo consideremos. 
La Cuenta es personal, única e intransferible, es decir que bajo ningún concepto se podrá vender o ceder a otra persona. Cada Usuario accede a la Cuenta con la clave personal de seguridad que haya elegido y que deberá mantener bajo estricta confidencialidad. En cualquier caso, el Usuario será el único responsable por las operaciones que se realicen en su Cuenta. En caso de detectar un uso no autorizado de su Cuenta, deberá notificar de forma inmediata y fehaciente al Sitio. 
El Sitio podrá rechazar una solicitud de registro o bien cancelar un registro ya aceptado, sin que esto genere derecho a un resarcimiento. No podrán registrarse nuevamente en el Sitio los Usuarios que hayan sido inhabilitadas previamente. 
Además, en caso de detectar el uso de más de una cuenta, el Sitio se reserva la facultad de tomar medidas medida si considera que ese accionar puede perjudicar al resto de las personas que usan el Sitio, más allá de las sanciones que pudieran corresponder. 


VI.- Privacidad


Los datos recolectados por el Sitio en las Cuentas, serán usados para que el Usuario, que publique información en el Sitio, pueda ser contactado por el interesado en adquirir bienes y/o servicios relacionados a la información publicada. El Sitio sólo pone a disposición de los Usuarios un espacio virtual que les permite ponerse en comunicación mediante internet para encontrar una forma de vender y/o comprar bienes y/o servicios. El Sitio utilizará la información recabada por los Usuarios para mejorar los servicios prestados, personalizar y mejorar la experiencia de los Usuarios en la utilización del Sitio.


VII.- Las Publicaciones


Las publicaciones podrán incluir textos descriptivos, gráficos, fotografías y otros contenidos y condiciones pertinentes para la venta del bien y/o la prestación del servicio, siempre que no violen ninguna disposición de este acuerdo ni ninguna otra normativa legal aplicable. El Usuario acepta no anunciar, enviar por e-mail ni de cualquier otro modo poner a disposición contenido que sea contrario a la ley, viole la propiedad intelectual y/o industrial, derecho de autor, secreto comercial, confidencialidad y/u otro derecho de propiedad de cualquier persona.
El Sitio no tiene control sobre la información provista por los Usuarios. Esta información puede contener errores ortográficos y/o errores técnicos. De esta forma, el Sitio no garantiza, ni se hace responsable de la precisión de la información presentada incluyendo la moneda, el precio, la calidad de los bienes y/o servicios ofrecidos por los Usuarios, como así también del cumplimiento de la propiedad intelectual o la legalidad de los mismos.


VIII.- Propiedad Intelectual
El Sitio se reserva todos los derechos de propiedad intelectual y demás derechos sobre el servicio, así como sobre los contenidos publicados, informaciones, imágenes, videos y bancos de datos. Por ello, está expresamente prohibida cualquier modificación, reproducción, publicación, transmisión a terceros y/o demás uso o explotación de la propiedad protegida sin el consentimiento previo por escrito del Sitio. En cualquier caso, los Usuarios que usen los servicios no podrán utilizar la propiedad intelectual del Sitio de una manera que cause confusión en el público y deberán llevar a cabo su actividad comercial bajo una marca o nombre comercial propio y distintivo, que no resulte confundible con la marca AgroAlva del Sitio.
En caso que un Usuario o cualquier publicación infrinja la propiedad intelectual del Sitio o de terceros, el Sitio podrá remover dicha publicación total o parcialmente, sancionar al Usuario conforme a lo previsto en estos Términos y Condiciones y ejercer las acciones extrajudiciales y/o judiciales correspondientes.
El usuario no podrá realizar publicaciones que violen los derechos de propiedad intelectual y/o industrial, derecho de autor, secreto comercial, acuerdo de confidencialidad, u otro derecho de propiedad de cualquier persona, o contenido respecto del cual el Usuario no tiene derecho a poner a disposición del público conforme a una disposición legal y/o disposición contractual. El Sitio no se responsabiliza por el uso no autorizado de imágenes o marcas, logotipos, diseños o cualquier otro derecho de propiedad intelectual que afecte a los Usuarios y/o al público en general que acceda al Sitio.
El Sitio respeta la propiedad intelectual de los Usuarios y/o terceros. Si usted sabe o sospecha que cualquier uso del servicio del Sitio constituye un incumplimiento de la propiedad intelectual y/o afecta otro tipo de derechos, podrá denunciar dicha situación y solicitar la suspensión, rectificación y/o retiro de la publicación, debiendo contactarse al departamento de soporte vía e-mail a completar@completar.com.ar.


IX.- Usos prohibidos


No está permitida ninguna acción o uso de dispositivo, software u otro medio tendiente a interferir tanto en las actividades y operatoria del Sitio como en las bases de datos el mismo. Cualquier intromisión, tentativa y/o actividad violatoria y/o contraria a las leyes sobre derecho de propiedad intelectual y/o a las prohibiciones estipuladas en los Términos y Condiciones, harán pasible a su responsable de las acciones legales pertinentes tanto con las sanciones previstas Términos y Condiciones como así también la responsabilidad administrativa, civil y/o penal que pudiera incurrir. Todo Usuario será legalmente responsable de las siguientes conductas: a) Uso indebido del Sitio y/o de la información que contenga; b) Uso con fines y/o efectos ilícitos del Sitio, sus servicios y/o de la información que contenga; c) Causar inutilización, demora, deterioro y/o daño al Sitio, sus servicios y/o a la información que contenga; d) Reproducción total o parcial, comercialización, distribución, publicación y/o modificación no autorizada de información.


X.- Indemnidad



El Sitio le brinda al Usuario la posibilidad de ofertar sus productos y/o servicios para que las personas que accedan al Sitio puedan contactar directamente con el Usuario a los datos que de contacto que éste proporciona, y así los Terceros Contratantes contraten de forma directa los Usuarios, resultando el Sitio totalmente ajeno a la contratación de aquellas partes celebren. El Sitio no es el propietario de los artículos ofrecidos, no tiene posesión de ellos ni los ofrece en venta. El Sitio no interviene en el perfeccionamiento de las operaciones realizadas entre los Usuarios ni en las condiciones por ellos estipuladas para las mismas, por ello no se hace responsable ni ofrece garantía alguna por la existencia, calidad, cantidad, estado, funcionamiento o integridad o legitimidad de los bienes y/o servicios ofrecidos, adquiridos o enajenados por los Usuarios, como así también de los servicios contratados.
El Sitio no se hará responsable por el efectivo cumplimiento de las obligaciones asumidas por los Usuarios en el perfeccionamiento de las operaciones. En caso de que uno o más Usuarios o algún tercero inicien cualquier tipo de acción y/o reclamo con base en operaciones realizadas a través del Sitio, los Usuarios eximen de toda responsabilidad al Sitio y a sus directores, gerentes, empleados, agentes, operarios, representantes y apoderados. Los Usuarios mantendrán indemne al Sitio y a sus directores, gerentes, empleados, agentes, operarios, representantes y apoderados, por cualquier reclamo iniciado por otros usuarios y/o terceros, relacionados con sus actividades en el Sitio, el cumplimiento y/o el incumplimiento de los Términos y Condiciones o demás políticas, así como respecto de cualquier violación de las leyes o derecho de terceros
El Sitio procura que la información contenida en su sitio web sea completa, exacta y actualizada. Sin embargo, no está en condiciones de garantizar dicha integridad, exactitud o vigencia de toda la información ofrecida. Por ello, no garantiza un servicio libre de errores e ininterrumpido y no será responsable bajo ninguna circunstancia por eventuales daños y/o perjuicios directos o indirectos que puedan derivarse de su uso, por errores o inexactitudes de la información contenida en él, ni respecto de interrupciones, demoras, virus o fallas del sistema.


XI.- Ley Aplicable


Los Términos y Condiciones se rigen por la ley argentina. Toda controversia derivada de su aplicación, interpretación, ejecución o validez será resuelta por los tribunales nacionales ordinarios competentes, con asiento en la ciudad de Las Breñas, Provincia de Chaco, salvo disposición específica de normas de orden público. Para todos los efectos relacionados con estos Términos y Condiciones y con su uso, el Sitio establece como domicilio completar, de la provincia de Chaco, Argentina.`;

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.content}>{TERMS_AND_CONDITIONS}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  content: {
    fontSize: 15,
    lineHeight: 24,
    color: "#212121",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
});