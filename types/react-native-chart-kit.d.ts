declare module 'react-native-chart-kit' {
    import { ViewStyle } from 'react-native';
    import React from 'react';

    export interface ChartConfig {
        backgroundColor?: string;
        backgroundGradientFrom?: string;
        backgroundGradientTo?: string;
        decimalPlaces?: number;
        color?: (opacity?: number) => string;
        labelColor?: (opacity?: number) => string;
        style?: ViewStyle;
        propsForDots?: object;
        propsForBackgroundLines?: object;
        barPercentage?: number;
        useShadowColorFromDataset?: boolean;
    }

    export interface AbstractChartProps {
        width: number;
        height: number;
        chartConfig: ChartConfig;
        style?: ViewStyle;
        bezier?: boolean;
        fromZero?: boolean;
    }

    export interface LineChartData {
        labels: string[];
        datasets: Array<{
            data: number[];
            color?: (opacity?: number) => string;
            strokeWidth?: number;
        }>;
        legend?: string[];
    }

    export interface BarChartData {
        labels: string[];
        datasets: Array<{
            data: number[];
        }>;
    }

    export interface PieChartData {
        name: string;
        population: number;
        color: string;
        legendFontColor?: string;
        legendFontSize?: number;
    }

    export interface LineChartProps extends AbstractChartProps {
        data: LineChartData;
        withDots?: boolean;
        withShadow?: boolean;
        withInnerLines?: boolean;
        withOuterLines?: boolean;
        withVerticalLines?: boolean;
        withHorizontalLines?: boolean;
        withVerticalLabels?: boolean;
        withHorizontalLabels?: boolean;
        renderDotContent?: (params: { x: number; y: number; index: number }) => React.ReactNode;
        onDataPointClick?: (data: { index: number; value: number; dataset: object; x: number; y: number; getColor: (opacity: number) => string }) => void;
    }

    export interface BarChartProps extends AbstractChartProps {
        data: BarChartData;
        withVerticalLabels?: boolean;
        withHorizontalLabels?: boolean;
        showValuesOnTopOfBars?: boolean;
        flatColor?: boolean;
    }

    export interface PieChartProps {
        data: PieChartData[];
        width: number;
        height: number;
        chartConfig: ChartConfig;
        accessor: string;
        backgroundColor?: string;
        paddingLeft?: string;
        absolute?: boolean;
        hasLegend?: boolean;
        style?: ViewStyle;
    }

    export class LineChart extends React.Component<LineChartProps> { }
    export class BarChart extends React.Component<BarChartProps> { }
    export class PieChart extends React.Component<PieChartProps> { }
    export class ProgressChart extends React.Component<AbstractChartProps & { data: { labels?: string[]; data: number[] } }> { }
    export class ContributionGraph extends React.Component<AbstractChartProps & { values: Array<{ date: string; count: number }>; endDate: Date; numDays: number }> { }
    export class StackedBarChart extends React.Component<AbstractChartProps & { data: { labels: string[]; legend: string[]; data: number[][]; barColors: string[] } }> { }
}
