import SalahTutorial from '../components/salah/SalahTutorial';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function SalahTutorialPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Learn Salah - Step-by-Step Prayer Tutorial | Talbiyah.ai</title>
        <meta name="description" content="A free, interactive step-by-step tutorial for learning how to pray Salah correctly - movements, recitations, and timing explained." />
        <link rel="canonical" href="https://talbiyah.ai/salah" />
        <meta property="og:title" content="Learn Salah - Step-by-Step Prayer Tutorial | Talbiyah.ai" />
        <meta property="og:description" content="A free, interactive step-by-step tutorial for learning how to pray Salah correctly - movements, recitations, and timing explained." />
        <meta property="og:url" content="https://talbiyah.ai/salah" />
        <meta name="twitter:title" content="Learn Salah - Step-by-Step Prayer Tutorial | Talbiyah.ai" />
        <meta name="twitter:description" content="A free, interactive step-by-step tutorial for learning how to pray Salah correctly - movements, recitations, and timing explained." />
      </Helmet>
      <SalahTutorial
        standalone={true}
        onComplete={() => navigate('/dashboard')}
        onBack={() => navigate(-1)}
      />
    </>
  );
}
