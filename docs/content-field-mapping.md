# Content Field Mapping

Maps each booster input to its data field, score item, OHMYTRIP customer-screen
location, whether it is required, and whether publishing needs approval. Score
item keys are the `key` values in `src/lib/contentScore.ts`.

Publish approval: content edits are saved as **Draft** and become customer-visible
only after **게시 요청** → **Needs review / Published** (mock approval). So every
row below is "publish-approval: Yes" — nothing goes live without a publish request.

## Basic info & location (mission: basic-info / location)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 호텔명 (EN) | `hotel.name.EN` | name-en | Detail title | Yes |
| 성급 | `hotel.grade` | star | Star row | No |
| 연락처 | `hotel.phone` | phone | (contact) | Yes |
| 주소 (EN) | `hotel.addresses.EN` | address-en | Detail address | Yes |
| 우편번호 | `hotel.postCode` | postcode | (address) | No |
| 국가·지역 | `hotel.country`, `hotel.regionName` | region | Search/exposure | No |
| 지도 위치 | `hotel.latitude`, `hotel.longitude` | map | 위치 및 주변 map | No |
| 주변 정보 | `hotel.nearby[]` | nearby | 위치 및 주변 list | No |

## Description (mission: description)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 호텔 설명 (EN) | `hotel.descriptions.EN` | desc-20, desc-100 | 호텔 소개 | No |

## Facilities (mission: facilities)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 시설 및 서비스 | `hotel.facilities[]` | fac-3, fac-8 | 주요 시설 chips | Yes (3+) |
| 시설 사진 | `hotel.images[].category='facility'/'pool'` | fac-photos, photo-facility | Gallery | No |

## Hotel photos (mission: hotel-photos)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 대표 사진 | `image.isRepresentative` | rep-photo | Gallery hero | Yes |
| 사진 수 | `hotel.images.length` | hotel-10, hotel-20 | Gallery | Yes (10+) |
| 로비/외관/레스토랑/시설 | `image.category` | photo-lobby/exterior/restaurant/facility | Gallery | No |
| 해상도 | `image.width/height` | photo-res | Gallery | No |
| 사진 태그 | `image.tags[]` | photo-tags | (search) | No |

## Room info (mission: room-info) — per room in `ROOM_TYPES`
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 객실명 | `room.name.EN` | room-name | Room card title | Yes |
| 객실 크기 | `room.sizeSqm` | room-size | Room card | No |
| 침대 구성 | `room.bedConfig` | room-bed | Room card | No |
| 최대 투숙인원 | `room.maxOccupancy` | room-occ | Room card | No |
| 객실 전망 | `room.view` | room-view-info | Room card | No |
| 객실 편의시설 | `room.amenities[]` | room-amenities | Room card | No |

## Room photos (mission: room-photos) — per room
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 객실 사진 존재 | `room.images` | room-all-photos | Room card image | Yes |
| 객실별 4장+ | `room.images.length` | room-4-photos | Room card | No |
| 침실/욕실/전망 | `room.images[].category` | room-bedroom/bathroom/view | Room card | No |

## Policies (mission: policies)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 체크인 | `hotel.checkIn` | checkin | 이용 안내 | Yes |
| 체크아웃 | `hotel.checkOut` | checkout | 이용 안내 | Yes |
| 이용 정책 | `hotel.policies[]` | policy-2, policy-4 | 이용 안내 list | No |

## Multilingual (mission: multilingual)
| Console field | Data field | Score item(s) | OHMYTRIP location | Required |
|---|---|---|---|---|
| 호텔명 다국어 | `hotel.name.*` | name-langs | Localised title | No |
| 설명 다국어 | `hotel.descriptions.*` | desc-langs | Localised 호텔 소개 | No |
| 번역 검토 상태 | `hotel.translationReview` | (surfaces 검토 필요) | — | No |

## Publish state (mission: review)
`hotel.publishStatus`: Editing / Saving / Saved / Draft / Needs review /
Published / Rejected. `hotel.contentUpdatedBy`: hotel | internal (overview).
