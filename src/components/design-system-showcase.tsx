import { Image } from "expo-image";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { images } from "@/constants/images";
import { colors } from "@/theme";

type Swatch = {
  name: string;
  hex: string;
  className?: string;
};

const primarySwatches: Swatch[] = [
  { name: "Lingua Purple", hex: colors.brand.purple },
  { name: "Lingua Deep Purple", hex: colors.brand.deepPurple },
  { name: "Lingua Blue", hex: colors.brand.blue },
  { name: "Lingua Green", hex: colors.brand.green },
];

const semanticSwatches: Swatch[] = [
  { name: "Success", hex: colors.semantic.success },
  { name: "Warning", hex: colors.semantic.warning },
  { name: "Streak", hex: colors.semantic.streak },
  { name: "Error", hex: colors.semantic.error },
  { name: "Info", hex: colors.semantic.info },
];

const neutralSwatches: Swatch[] = [
  { name: "Text / Primary", hex: colors.neutral.textPrimary },
  { name: "Text / Secondary", hex: colors.neutral.textSecondary },
  { name: "Border", hex: colors.neutral.border },
  { name: "Surface", hex: colors.neutral.surface },
  { name: "Background", hex: colors.neutral.background, className: "border border-border" },
];

const typeRows = [
  { label: "H1", usage: "Page / Screen Title", size: "32px", weight: "Bold", leading: "1.2", className: "h1" },
  { label: "H2", usage: "Section Title", size: "24px", weight: "SemiBold", leading: "1.3", className: "h2" },
  { label: "H3", usage: "Card / Module Title", size: "20px", weight: "SemiBold", leading: "1.3", className: "h3" },
  { label: "H4", usage: "Subheading", size: "16px", weight: "Medium", leading: "1.4", className: "h4" },
  { label: "Body Large", usage: "Important content", size: "16px", weight: "Regular", leading: "1.6", className: "body-lg text-text-primary" },
  { label: "Body Medium", usage: "Body text", size: "14px", weight: "Regular", leading: "1.6", className: "body-md text-text-primary" },
  { label: "Body Small", usage: "Supporting text", size: "13px", weight: "Regular", leading: "1.6", className: "body-sm text-text-primary" },
  { label: "Caption", usage: "Labels, meta text", size: "11px", weight: "Regular", leading: "1.4", className: "caption" },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="gap-2">
      <Text className="section-label">{title}</Text>
      <View className="h-px bg-border" />
    </View>
  );
}

function SwatchGrid({ title, swatches }: { title: string; swatches: Swatch[] }) {
  return (
    <View className="gap-4">
      <Text className="overline">{title}</Text>
      <View className="flex-row flex-wrap gap-x-8 gap-y-6">
        {swatches.map((swatch) => (
          <View className="w-28 gap-2" key={swatch.name}>
            <View
              className={`h-20 w-20 rounded-xl ${swatch.className ?? ""}`}
              style={{ backgroundColor: swatch.hex }}
            />
            <View>
              <Text className="caption font-poppins-semibold uppercase text-text-secondary">
                {swatch.name}
              </Text>
              <Text className="body-sm text-text-secondary">{swatch.hex}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function DesignSystemShowcase() {
  return (
    <ScrollView
      className="flex-1 app-screen"
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-4">
        <View className="card gap-6 p-6">
          <SectionHeader title="Brand" />
          <View className="flex-row items-center justify-center gap-5 py-2">
            <Image
              source={images.mascotLogo}
              className="h-28 w-28"
              contentFit="contain"
            />
            <Text className="font-poppins-bold text-6xl text-text-primary">lingua</Text>
          </View>
        </View>

        <View className="card gap-8 p-6">
          <SectionHeader title="Colors" />
          <SwatchGrid title="Primary" swatches={primarySwatches} />
          <SwatchGrid title="Semantic" swatches={semanticSwatches} />
          <SwatchGrid title="Neutrals" swatches={neutralSwatches} />
        </View>

        <View className="card gap-8 p-6">
          <SectionHeader title="Typography" />
          <View className="gap-2">
            <Text className="overline">Font Family</Text>
            <Text className="font-poppins-bold text-6xl text-text-primary">Poppins</Text>
            <Text className="body-lg">
              Poppins is a modern, geometric sans-serif typeface that provides
              excellent readability and a friendly personality.
            </Text>
          </View>

          <View className="gap-6">
            {typeRows.map((row) => (
              <View
                className="flex-row items-center justify-between gap-3"
                key={row.label}
              >
                <Text className={`${row.className} w-24`}>{row.label}</Text>
                <Text className="body-sm flex-1 text-text-secondary">
                  {row.usage}
                </Text>
                <Text className="body-sm w-12 text-text-secondary">
                  {row.size}
                </Text>
                <Text className="body-sm w-16 text-text-secondary">
                  {row.weight}
                </Text>
                <Text className="body-sm w-8 text-right text-text-secondary">
                  {row.leading}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 40,
  },
});
