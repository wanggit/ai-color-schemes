import { NextPage } from 'next';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import GradientBackground2 from '@/app/components/GradientBackground2';

const HowToUse: NextPage = () => {
    const t = useTranslations('HowToUse');

    const sections = [
        {
            title: t('section1.title'),
            description: t('section1.description'),
            image: "/1.png",
            imageAlt: "Color Input",
            imageLeft: false
        },
        {
            title: t('section2.title'),
            description: [
                t('section2.item1'),
                t('section2.item2'),
                t('section2.item3'),
                t('section2.item4'),
                t('section2.item5'),
                t('section2.item6')
            ],
            image: "/2.png",
            imageAlt: "Generated Scheme",
            imageLeft: true
        },
        {
            title: t('section3.title'),
            description: [
                t('section3.item1'),
                t('section3.item2'),
                t('section3.item3'),
                t('section3.item4'),
                t('section3.item5')
            ],
            image: "/6.png",
            imageAlt: "Scheme Details",
            imageLeft: false
        },
        {
            title: t('section4.title'),
            description: t('section4.description'),
            image: "/3.png",
            imageAlt: "Scheme Example",
            imageLeft: true
        },
        {
            title: t('section5.title'),
            description: t('section5.description'),
            image: "/4.png",
            imageAlt: "Tailwind CSS Config",
            imageLeft: false
        },
        {
            title: t('section6.title'),
            description: t('section6.description'),
            image: "/5.png",
            imageAlt: "Bootstrap Config",
            imageLeft: true
        }
    ];

    return (
        <div className="relative isolate">
            {/* Hero Section */}
            <div className="relative">
                <GradientBackground2 />
                <div className="mx-auto max-w-4xl pt-20 pb-32 sm:pt-48 sm:pb-40 text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">
                        {t('title')}
                    </h1>
                </div>
            </div>

            {/* Sections */}
            {sections.map((section, index) => (
                <div key={index} className={`py-24 sm:py-32 ${index % 2 === 0 ? 'bg-gray-900' : 'relative'}`}>
                    {index % 2 !== 0 && <GradientBackground2 />}
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className={`grid grid-cols-1 gap-16 items-center lg:grid-cols-2`}>
                            <div className={`lg:pr-8 lg:pt-4 ${section.imageLeft ? 'lg:order-last' : ''}`}>
                                <div className="lg:max-w-lg">
                                    <h2 className={`text-3xl font-bold tracking-tight ${index % 2 === 0 ? 'text-white' : 'text-gray-900'}`}>{section.title}</h2>
                                    {Array.isArray(section.description) ? (
                                        <ul className={`mt-6 list-disc list-inside space-y-2 text-lg leading-8 ${index % 2 === 0 ? 'text-gray-300' : 'text-gray-600'}`}>
                                            {section.description.map((item, i) => <li key={i}>{item}</li>)}
                                        </ul>
                                    ) : (
                                        <p className={`mt-6 text-lg leading-8 ${index % 2 === 0 ? 'text-gray-300' : 'text-gray-600'}`}>{section.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <Image
                                    src={section.image}
                                    alt={section.imageAlt}
                                    className="rounded-xl shadow-xl ring-1 ring-gray-400/10"
                                    width={500}
                                    height={400}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Final Section */}
            <div className="bg-gray-900 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('section7.title')}</h2>
                    <p className="mt-6 text-lg leading-8 text-gray-300">{t('section7.description')}</p>
                </div>
            </div>
        </div>
    );
};

export default HowToUse;
