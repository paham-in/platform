//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:json_annotation/json_annotation.dart';

part 'devreset_reset_response.g.dart';


@JsonSerializable(
  checked: true,
  createToJson: true,
  disallowUnrecognizedKeys: false,
  explicitToJson: true,
)
class DevresetResetResponse {
  /// Returns a new [DevresetResetResponse] instance.
  DevresetResetResponse({

     this.deleted,

     this.message,

     this.table,
  });

  @JsonKey(
    
    name: r'deleted',
    required: false,
    includeIfNull: false,
  )


  final int? deleted;



  @JsonKey(
    
    name: r'message',
    required: false,
    includeIfNull: false,
  )


  final String? message;



  @JsonKey(
    
    name: r'table',
    required: false,
    includeIfNull: false,
  )


  final String? table;





    @override
    bool operator ==(Object other) => identical(this, other) || other is DevresetResetResponse &&
      other.deleted == deleted &&
      other.message == message &&
      other.table == table;

    @override
    int get hashCode =>
        deleted.hashCode +
        message.hashCode +
        table.hashCode;

  factory DevresetResetResponse.fromJson(Map<String, dynamic> json) => _$DevresetResetResponseFromJson(json);

  Map<String, dynamic> toJson() => _$DevresetResetResponseToJson(this);

  @override
  String toString() {
    return toJson().toString();
  }

}

