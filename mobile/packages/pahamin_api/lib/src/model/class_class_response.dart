//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'class_class_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class ClassClassResponse {
  /// Returns a new [ClassClassResponse] instance.
  ClassClassResponse({

     this.allowTutoring,

     this.contentPrice,

     this.groupPrice,

     this.id,

     this.name,

     this.pricePerSession,

     this.slug,
  });

  @JsonKey(
    
    name: r'allow_tutoring',
    required: false,
    includeIfNull: false,
  )


  final bool? allowTutoring;



  @JsonKey(
    
    name: r'content_price',
    required: false,
    includeIfNull: false,
  )


  final num? contentPrice;



  @JsonKey(
    
    name: r'group_price',
    required: false,
    includeIfNull: false,
  )


  final num? groupPrice;



  @JsonKey(
    
    name: r'id',
    required: false,
    includeIfNull: false,
  )


  final int? id;



  @JsonKey(
    
    name: r'name',
    required: false,
    includeIfNull: false,
  )


  final String? name;



  @JsonKey(
    
    name: r'price_per_session',
    required: false,
    includeIfNull: false,
  )


  final num? pricePerSession;



  @JsonKey(
    
    name: r'slug',
    required: false,
    includeIfNull: false,
  )


  final String? slug;





    @override
    bool operator ==(Object other) => identical(this, other) || other is ClassClassResponse &&
      other.allowTutoring == allowTutoring &&
      other.contentPrice == contentPrice &&
      other.groupPrice == groupPrice &&
      other.id == id &&
      other.name == name &&
      other.pricePerSession == pricePerSession &&
      other.slug == slug;

    @override
    int get hashCode =>
        allowTutoring.hashCode +
        contentPrice.hashCode +
        groupPrice.hashCode +
        id.hashCode +
        name.hashCode +
        pricePerSession.hashCode +
        slug.hashCode;

  factory ClassClassResponse.fromJson(Map<String, dynamic> json) => _$ClassClassResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ClassClassResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

