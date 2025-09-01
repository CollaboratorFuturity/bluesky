
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

const charts = [
    {
        title: 'LED Spectrum and Photoreceptor Absorption',
        url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/283fa053f_image.png',
        alt: 'A chart showing the absorption spectrum for Magenta, Cyan, and Yellow photoreceptors, overlaid with the emission spectrums of Blue, Green, and Red LEDs.'
    },
    {
        title: 'Photoswitch Absorbance Spectrum',
        url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5362e4ded_image.png',
        alt: 'A chart showing the absorbance for R, Y, and B activation and deactivation across the UV and visible light spectrum.'
    }
];

export default function ChartPage() {
    return (
        <div className="space-y-8">
             <h1 className="text-2xl font-bold flex items-center gap-3 text-gray-900"><LineChart className="text-gray-600"/> Reference Charts</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {charts.map((chart, index) => (
                    <Card key={index} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-gray-900 text-lg font-bold">{chart.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <img 
                                src={chart.url} 
                                alt={chart.alt} 
                                className="w-full h-auto rounded-md border-2 border-gray-200"
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

