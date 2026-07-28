"use client";

type CountryCount = {
  code: string;
  count: number;
};

const countryPoints: Record<string, [number, number]> = {
  US: [178, 185], CA: [167, 118], MX: [171, 239], BR: [329, 328], AR: [301, 404],
  CL: [282, 387], PE: [279, 321], CO: [268, 282], VE: [296, 275], EC: [261, 303],
  BO: [300, 344], PY: [315, 369], UY: [323, 407], GT: [190, 253], CR: [211, 273],
  PA: [228, 270], CU: [229, 235], DO: [254, 244], JM: [232, 249],
  GB: [445, 137], IE: [431, 141], IS: [414, 91], FR: [458, 166], ES: [447, 187], PT: [435, 188],
  DE: [475, 151], NL: [466, 143], BE: [464, 153], IT: [477, 184], SE: [482, 107],
  NO: [469, 101], FI: [500, 102], DK: [473, 126], CH: [469, 170], AT: [483, 165],
  CZ: [489, 155], HU: [496, 171], HR: [489, 181], RS: [500, 182], RO: [508, 173],
  BG: [510, 187], GR: [499, 202], SK: [497, 162], SI: [485, 175], EE: [503, 124],
  LV: [503, 135], LT: [501, 142], PL: [496, 150], UA: [526, 154], RU: [590, 118],
  TR: [526, 190], GE: [548, 180], AZ: [557, 183], IL: [530, 217], IR: [573, 211],
  IQ: [551, 213], EG: [508, 233], MA: [446, 222], DZ: [468, 229], TN: [478, 213],
  SN: [428, 272], GH: [459, 288], CI: [451, 293], CM: [481, 301], NG: [469, 282],
  ET: [532, 283], UG: [515, 314], TZ: [526, 334], KE: [524, 302], ZM: [508, 355],
  ZW: [516, 373], MZ: [536, 369], MG: [567, 368], ZA: [493, 389],
  AE: [574, 244], QA: [569, 238], KW: [559, 229], OM: [585, 257], SA: [550, 245],
  KZ: [624, 164], UZ: [605, 187], IN: [635, 249], PK: [612, 226], NP: [650, 226],
  BD: [665, 244], LK: [649, 296], MM: [681, 259],
  CN: [704, 205], JP: [800, 203], KR: [766, 208], SG: [693, 306], ID: [722, 325],
  MY: [690, 296], KH: [708, 282], LA: [702, 263], PH: [770, 285], TH: [700, 272],
  VN: [720, 266], TW: [757, 243], HK: [737, 235], AU: [798, 385], NZ: [879, 416],
};

function countryName(code: string) {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ??
      code.toUpperCase()
    );
  } catch {
    return code.toUpperCase();
  }
}

export function AudienceMap({ countries }: { countries: CountryCount[] }) {
  const maximum = Math.max(1, ...countries.map((item) => item.count));
  const visible = countries
    .filter((item) => countryPoints[item.code.toUpperCase()])
    .slice(0, 18);

  return (
    <div className="audience-map">
      <svg
        role="img"
        aria-label={
          countries.length
            ? `Profile visits from ${countries.length} countries`
            : "No country-level profile visit data yet"
        }
        viewBox="0 0 960 500"
      >
        <g className="audience-map__land" aria-hidden="true">
          <path d="M72 111 124 69l90 5 62 58-30 37-31 3-25 63-37 19-50-44-41-15-21-53Z" />
          <path d="m252 255 65 19 34 70-28 116-38-21-14-85-33-55Z" />
          <path d="m406 104 65-35 102 22 31 48-44 34-41-21-42 21-38-21Z" />
          <path d="m440 197 76-8 64 56-30 144-61 41-42-87-22-93Z" />
          <path d="m575 116 112-54 150 39 64 87-55 55-95-11-39 60-98-38-34-64Z" />
          <path d="m735 323 90-27 79 51-24 92-98 17-54-65Z" />
          <path d="m862 422 37 14 18 31-42 10-27-23Z" />
        </g>
        <g className="audience-map__grid" aria-hidden="true">
          <path d="M0 125h960M0 250h960M0 375h960M240 0v500M480 0v500M720 0v500" />
        </g>
        {visible.map((item) => {
          const [cx, cy] = countryPoints[item.code.toUpperCase()];
          const radius = 5 + Math.sqrt(item.count / maximum) * 13;
          return (
            <g className="audience-map__point" key={item.code}>
              <circle cx={cx} cy={cy} r={radius + 7} opacity="0.12" />
              <circle cx={cx} cy={cy} r={radius} />
              <title>{`${countryName(item.code)}: ${item.count} visit${item.count === 1 ? "" : "s"}`}</title>
            </g>
          );
        })}
      </svg>
      {countries.length === 0 && (
        <div className="audience-map__empty">
          <b>Your map will fill in as visits arrive</b>
          <span>Country signals are approximate and privacy-safe.</span>
        </div>
      )}
    </div>
  );
}
