import { Link } from 'react-router-dom';
import { BookOpen, Shield, Heart, MessageCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function VirtualImamAbout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-6">
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Islamic Source Reference
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A reference tool to find authentic Islamic sources from the Qur'an and Sunnah upon the understanding of the Salaf
            </p>
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-2xl mx-auto">
              <p className="text-sm text-amber-900 font-semibold">
                ⚠️ Important: This is a reference tool only, not a mufti or Islamic authority. Always consult qualified scholars or imams for religious rulings and specific guidance.
              </p>
            </div>
          </div>

          <div className="space-y-12">
            <section>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    What This Tool Does
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-6 border-l-4 border-emerald-500">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      The Islamic Source Reference tool helps you find relevant Quranic verses and authentic Hadith based on your questions. It operates on fundamental principles of Islamic jurisprudence:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-800 font-medium">
                          <span className="text-emerald-700">Worldly Matters (Dunya):</span> Everything is Halal (permissible) unless proven prohibited by authentic evidence
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <p className="text-gray-800 font-medium">
                          <span className="text-emerald-700">Acts of Worship (Ibadah):</span> Everything is Haram (prohibited) unless proven with authentic evidence
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    Source Authority
                  </h2>
                  <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      This reference tool provides citations exclusively from:
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">
                          <strong className="text-blue-700">The Holy Qur'an:</strong> The eternal word of Allah
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">
                          <strong className="text-blue-700">Authentic Sunnah:</strong> Verified Hadith from reliable collections
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-800">
                          <strong className="text-blue-700">Understanding of the Salaf:</strong> Based on the methodology of the first three blessed generations
                        </span>
                      </li>
                    </ul>
                    <p className="text-gray-600 mt-4 text-sm italic">
                      All responses include specific citations from the Qur'an and authentic Hadith collections
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                    Conditions for Accepted Worship
                  </h2>
                  <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
                    <p className="text-gray-700 leading-relaxed mb-4">
                      For any act of worship to be accepted by Allah, it must fulfill three essential conditions:
                    </p>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-purple-700 mb-2">1. Proper Intention (Niyyah)</h3>
                        <p className="text-gray-700 text-sm">
                          The worship must be performed solely for the sake of Allah, with sincerity and without showing off
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-purple-700 mb-2">2. Authentic Evidence (Daleel)</h3>
                        <p className="text-gray-700 text-sm">
                          The act must be supported by clear evidence from the Qur'an or authentic Sunnah
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h3 className="font-semibold text-purple-700 mb-2">3. Correct Method (Kayfiyyah)</h3>
                        <p className="text-gray-700 text-sm">
                          The worship must be performed exactly as demonstrated by Prophet Muhammad (peace be upon him)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-8 border-2 border-red-300">
              <h2 className="text-2xl font-semibold text-red-900 mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6" />
                ALWAYS Consult Qualified Scholars
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4 font-semibold">
                This tool provides source references only - it is NOT a replacement for scholarly guidance. You MUST consult your local, trusted Imam or qualified Islamic scholar for:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span><strong>ALL religious rulings (fatawa)</strong> - This tool does not issue rulings</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Personal situations</strong> - Medical ethics, family disputes, financial matters</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Complex or nuanced questions</strong> - Matters requiring detailed analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Context-specific guidance</strong> - Your unique circumstances and needs</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-white rounded-lg border-2 border-red-200">
                <p className="text-red-900 font-bold text-center">
                  Use this tool to find sources, then verify and apply them with guidance from qualified scholars.
                </p>
              </div>
            </section>

            <div className="text-center pt-8">
              <Link
                to="/islamic-source-reference"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <MessageCircle className="w-5 h-5" />
                Find Islamic Sources
              </Link>
              <p className="text-gray-500 text-sm mt-4">
                Available 24/7 to help you find Quran & Hadith references
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            May Allah accept our efforts and grant us beneficial knowledge
          </p>
        </div>
      </div>
    </div>
  );
}
